import EventEmitter, { on } from 'node:events';
import { TRPCError, type TRPCRouterRecord } from '@trpc/server';
import { db } from '../../db'; 
import { protectedProcedure, publicProcedure } from '../../lib/trpc';
import { z } from 'zod';
import { channels, finalizedEvents, pendingEvents, users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export type WhoIsTyping = Record<string, { lastTyped: Date }>;

type EventMap<T> = Record<keyof T, any[]>;
class IterableEventEmitter<T extends EventMap<T>> extends EventEmitter<T> {
  toIterable<TEventName extends keyof T & string>(
    eventName: TEventName,
    opts?: NonNullable<Parameters<typeof on>[2]>,
  ): AsyncIterable<T[TEventName]> {
    return on(this as any, eventName, opts) as any;
  }
}

export interface MyEvents {
  createMessage: [channelId: string, data: {id: number, channelId: number, userId: number, createdAt: Date, modifiedAt: Date, content: String}]; //message type
  isTypingUpdate: [channelId: string, who: WhoIsTyping];
  reactionUpdate: [
    channelId: string,
    data: {            
      emoji: string;
      delta: 1 | -1;  // 1 for add, -1 for remove
      userId: number;
    }
  ];
  messageUpdate: [channelId: string, data: { id: number; content: string; modifiedAt: Date }];
}

// In a real app, you'd probably use Redis or something
export const ee = new IterableEventEmitter<MyEvents>();

// who is currently typing for each channel, key is `name`
export const currentlyTyping: Record<string, WhoIsTyping> = Object.create(null);

// every 1s, clear old "isTyping"
setInterval(() => {
  const updatedChats = new Set<string>();
  const now = Date.now();
  for (const [channelId, typers] of Object.entries(currentlyTyping)) {
    for (const [key, value] of Object.entries(typers ?? {})) {
      if (now - value.lastTyped.getTime() > 3e3) {
        delete typers[key];
        updatedChats.add(channelId);
      }
    }
  }
  updatedChats.forEach((channelId) => {
    ee.emit('isTypingUpdate', channelId, currentlyTyping[channelId] ?? {});
  });
}, 3e3).unref();

// Add new event emitter for message updates
export const messageUpdateEmitter = new EventEmitter();

export const chatRouter = {
  list: protectedProcedure.query(async () => {
    const chats = await db
      .select()
      .from(channels); //get a list of all chats

    if(!chats) {
        throw new TRPCError({code: "INTERNAL_SERVER_ERROR", message: "Something went wrong when returning the chats"}); //should at least get an empty list...
    }

    return chats; 
  }),

  createChat: protectedProcedure
    .input(z.object({ finalizedEventId: z.number().nullish(), pendingEventId: z.number().nullish()}))
    .mutation(async ({ ctx, input }) => {
      const { finalizedEventId, pendingEventId } = input;
      // console.log("in createChat() procedure, finalizedEventId: ", finalizedEventId, "pendingEventId: ", pendingEventId)

      // First check if a channel already exists for this event
      const existingChannel = await db
        .select()
        .from(channels)
        .where(
          finalizedEventId 
            ? eq(channels.finalizedEventId, finalizedEventId)
            : eq(channels.pendingEventId, pendingEventId!)
        )
        .get();

      if (existingChannel) {
        return existingChannel.id;
      }

      // If no channel exists, create a new one
      const channel = await db
        .insert(channels)
        .values({
          finalizedEventId,
          pendingEventId
        })
        .returning().get();
        
      if(!channel) {
        throw new TRPCError({code: "INTERNAL_SERVER_ERROR", message: "Something went wrong when creating the channel"}); 
      }

      if (!channel) {
        throw new TRPCError({code: "INTERNAL_SERVER_ERROR", message: "Failed to create chat channel"});
      }

      return channel.id;
    }),

  isTyping: protectedProcedure
    .input(z.object({ channelId: z.number(), typing: z.boolean() })) //where is typing from? on frontend where? or not idk
    .mutation(async ({ctx, input}) => {

      const session = ctx.session;
      
      if(!session) {
        throw new TRPCError({code: 'UNAUTHORIZED', message: "Invalid session"}); 
      }

      const { channelId, typing } = input;

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId));
      
       if(!user) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: "User not found"}); 
       }

       const theUser = user[0];

      if (!currentlyTyping[channelId]) {
        currentlyTyping[channelId] = {};
      }

      if (!typing) {
        delete currentlyTyping[channelId][theUser.name]; 
      } else {
        currentlyTyping[channelId][theUser.name] = {
          lastTyped: new Date(),
        };
      }
      ee.emit('isTypingUpdate', String(channelId), currentlyTyping[channelId]); //emit event saying who is now typing in the chat with this channel id
    }),

  whoIsTyping: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
      }),
    )
    .subscription(async function* (opts) { //opts has context in it, maybe I need to use it?
      const { channelId } = opts.input;

      let lastIsTyping = '';

      /**
       * yield who is typing if it has changed
       * won't yield if it's the same as last time
       */
      function* maybeYield(who: WhoIsTyping) { //binds (assoc. id.fier with a val) a generator function to the name maybeYield; generator is basically an iterator that only returns its value when needed
        const idx = Object.keys(who).toSorted().toString();
        if (idx === lastIsTyping) {
          return;
        }
        yield Object.keys(who);

        lastIsTyping = idx;
      }

      // emit who is currently typing
      yield* maybeYield(currentlyTyping[channelId] ?? {});

      for await (const [eventChannelId, who] of ee.toIterable('isTypingUpdate', {
        signal: opts.signal,
      })) {
        if (eventChannelId === String(channelId)) {
          yield* maybeYield(who); //yield to the correct channel
        }
      }
    }),

  getOrCreateChat: protectedProcedure
    .input(z.object({ finalizedEventId: z.number().nullish(), pendingEventId: z.number().nullish()}))
    .query(async ({ ctx, input }) => {
      const { finalizedEventId, pendingEventId } = input;

      // First check if a channel already exists for this event
      const existingChannel = await db
        .select()
        .from(channels)
        .where(
          finalizedEventId 
            ? eq(channels.finalizedEventId, finalizedEventId)
            : eq(channels.pendingEventId, pendingEventId!)
        )
        .get();

      if (existingChannel) {
        return existingChannel.id;
      }

      // If no channel exists, create a new one
      const channel = await db
        .insert(channels)
        .values({
          finalizedEventId,
          pendingEventId
        })
        .returning().get();

      if (!channel) {
        throw new TRPCError({code: "INTERNAL_SERVER_ERROR", message: "Failed to create chat channel"});
      }

      return channel.id;
    }),
  getAdmin: publicProcedure
  .input(z.object({ channelId: z.number()})) //where is typing from? on frontend where? or not idk
  .output(z.object({adminUserId: z.number()}))
  .query(async ({ ctx, input }) => {

    const { channelId } = input;
    const foundChannel = await db
            .select()
            .from(channels)
            .where(eq(channels.id, channelId));
    
    if(!foundChannel) {
      throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: "Something went wrong"}); 
    }
      
    if(foundChannel.length == 0) {
      throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: "Something went wrong"}); 
    }
    
    const channel = foundChannel[0];
    
    const pEventId = channel.pendingEventId;
    const fEventId = channel.finalizedEventId;
    
    let adminUserId;
    
    if(pEventId) {
      const foundPEvent = await db
          .select()
          .from(pendingEvents)
          .where(eq(pendingEvents.id, pEventId));
    
      if(!foundPEvent) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: "Something went wrong"}); 
      }
          
      if(foundPEvent.length == 0) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: "Something went found"}); 
      }
    
      const pEvent = foundPEvent[0];
      adminUserId = pEvent.eventCreatorId;
    } else if (fEventId) {
      const foundFEvent = await db
            .select()
            .from(finalizedEvents)
            .where(eq(finalizedEvents.id, fEventId));
    
      if(!foundFEvent) {
          throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: "Something went wrong"}); 
      }
          
      if(foundFEvent.length == 0) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: "Something went wrong"}); 
      }
    
      const fEvent = foundFEvent[0];
      adminUserId = fEvent.eventCreatorId;
    } else {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: "Something went wrong"}); 
    }
    
    return {adminUserId: adminUserId!};
  })  
} satisfies TRPCRouterRecord;