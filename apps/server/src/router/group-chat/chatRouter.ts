import { EventEmitter, on } from 'node:events';
import { TRPCError, type TRPCRouterRecord } from '@trpc/server';
import { db } from '../../db';
import { protectedProcedure, publicProcedure } from '../../lib/trpc';
import { z } from 'zod';
import { channels, users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export type WhoIsTyping = Record<string, { lastTyped: Date }>;

type EventMap<T> = Record<keyof T, any[]>;
class IterableEventEmitter<T extends EventMap<T>> extends EventEmitter {
  toIterable<TEventName extends keyof T & string>(
    eventName: TEventName,
    opts?: NonNullable<Parameters<typeof on>[2]>,
  ): AsyncIterable<T[TEventName]> {
    return on(this as any, eventName, opts) as any;
  }
}

export interface MyEvents {
  createMessage: [
    channelId: string,
    data: {
      id: number;
      channelId: number;
      createdAt: Date;
      modifiedAt: Date;
      content: string;
    }
  ];
  isTypingUpdate: [channelId: string, who: WhoIsTyping];
}

export const ee = new IterableEventEmitter<MyEvents>();

// who is currently typing for each channel
export const currentlyTyping: Record<string, WhoIsTyping> = Object.create(null);

// clear expired typing indicators
setInterval(() => {
  const updatedChannels = new Set<string>();
  const now = Date.now();

  for (const [channelId, typers] of Object.entries(currentlyTyping)) {
    for (const [key, value] of Object.entries(typers)) {
      if (now - value.lastTyped.getTime() > 3000) {
        delete typers[key];
        updatedChannels.add(channelId);
      }
    }
  }

  for (const channelId of updatedChannels) {
    ee.emit('isTypingUpdate', channelId, currentlyTyping[channelId] ?? {});
  }
}, 3000).unref();

export const chatRouter = {
<<<<<<< HEAD
  list: publicProcedure.query(async () => {
    const chats = await db.select().from(channels);
    return chats;
  }),

  createChat: publicProcedure
    .input(
      z.object({
        finalizedEventId: z.number().nullable().optional(),
        pendingEventId: z.number().nullable().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { finalizedEventId, pendingEventId } = input;

      const [channel] = await db
=======
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
>>>>>>> origin/dev
        .insert(channels)
        .values({ finalizedEventId, pendingEventId })
        .returning();

      if (!channel) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Channel creation failed',
        });
      }

<<<<<<< HEAD
=======
      if (!channel) {
        throw new TRPCError({code: "INTERNAL_SERVER_ERROR", message: "Failed to create chat channel"});
      }

>>>>>>> origin/dev
      return channel.id;
    }),

  isTyping: protectedProcedure
    .input(z.object({ channelId: z.number(), typing: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      const { channelId, typing } = input;

      if (!session) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId));

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      const key = String(channelId);
      if (!currentlyTyping[key]) currentlyTyping[key] = {};

      if (typing) {
        currentlyTyping[key][user.name] = { lastTyped: new Date() };
      } else {
        delete currentlyTyping[key][user.name];
      }

      ee.emit('isTypingUpdate', key, currentlyTyping[key]);
    }),

<<<<<<< HEAD
  whoIsTyping: publicProcedure
    .input(z.object({ channelId: z.number() }))
    .subscription(async function* ({ input, ctx, signal }) {
      const channelId = String(input.channelId);
      let lastSnapshot = '';
=======
  whoIsTyping: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
      }),
    )
    .subscription(async function* (opts) { //opts has context in it, maybe I need to use it?
      const { channelId } = opts.input;
>>>>>>> origin/dev

      function* maybeYield(who: WhoIsTyping) {
        const keys = Object.keys(who).sort();
        const snapshot = keys.join(',');

        if (snapshot !== lastSnapshot) {
          lastSnapshot = snapshot;
          yield keys;
        }
      }

      yield* maybeYield(currentlyTyping[channelId] ?? {});

      for await (const [eventChannelId, who] of ee.toIterable('isTypingUpdate', { signal })) {
        if (eventChannelId === channelId) {
          yield* maybeYield(who);
        }
      }
    }),

<<<<<<< HEAD
  getChannelByEventId: protectedProcedure
    .input(z.object({ eventId: z.number(), isFinalizedEvent: z.boolean().optional() }))
    .query(async ({ input }) => {
      const { eventId, isFinalizedEvent } = input;

      const [channel] = isFinalizedEvent
        ? await db.select().from(channels).where(eq(channels.finalizedEventId, eventId))
        : await db.select().from(channels).where(eq(channels.pendingEventId, eventId));

      if (!channel) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Channel not found for event',
        });
      }

      return channel;
    }),
} satisfies TRPCRouterRecord;
=======
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
} satisfies TRPCRouterRecord;
>>>>>>> origin/dev
