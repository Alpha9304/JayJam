import { tracked, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from "../../lib/trpc";
import { currentlyTyping, ee } from './chatRouter';
import { channels, finalizedEvents, messages, pendingEvents, users } from '../../db/schema';
import { db } from '../../db';
import { and, eq, gt } from 'drizzle-orm';
import { isBuffer } from 'node:util';

// Create the message router
export const messageRouter = router({
  createMessage: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        content: z.string().trim().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { channelId, content } = input;
      const session = ctx.session;

      if (!session) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid session' });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId));

      if (!user) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'User not found' });
      }

      const message = await db
        .insert(messages)
        .values({
          channelId,
          userId: session.userId,
          content,
          createdAt: new Date(),
          modifiedAt: new Date(),
        })
        .returning()
        .get();

      if (!message) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create message' });
      }

      // Clean up typing state
      const channelTyping = currentlyTyping[channelId];
      if (channelTyping) {
        delete channelTyping[user.name];
        ee.emit('isTypingUpdate', String(channelId), channelTyping);
      }

      const fullMessage = {
        ...message,
        userId: session.userId,
        userName: user.name,
      };

<<<<<<< HEAD
      ee.emit('createMessage', String(channelId), fullMessage);

      return fullMessage;
    }),

  infinite: publicProcedure
=======
      return message;
  }),
  deleteMessage: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .output(z.object({success: z.boolean(), resText: z.string()}))
    .mutation(async ( {ctx, input}) => {
      const { id } = input;

      const session = ctx.session;

      if(!session) {
        throw new TRPCError({code: 'UNAUTHORIZED', message: "Invalid session"}); 
      }
    
      const foundMessage = await db
        .select()
        .from(messages)
        .where(eq(messages.id, id));

      
      if(!foundMessage) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: "Something went wrong"}); 
      }

      if(foundMessage.length == 0) {
        throw new TRPCError({code: 'NOT_FOUND', message: "Message not found"}); 
      }

      const message = foundMessage[0];

      const messageChannelId = message.channelId;

      const foundChannel = await db
        .select()
        .from(channels)
        .where(eq(channels.id, messageChannelId));

      if(!foundChannel) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: "Something went wrong"}); 
      }
  
      if(foundChannel.length == 0) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: "Something went wrong"}); 
      }

      const channel = foundChannel[0];

      const pEventId = channel.pendingEventId;
      const fEventId = channel.finalizedEventId;

      let eventCreatorId;

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
        eventCreatorId = pEvent.eventCreatorId;
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
        eventCreatorId = fEvent.eventCreatorId;
      } else {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: "Something went wrong"}); 
      }

      if(message.userId !== session.userId && session.userId !== eventCreatorId) {
        throw new TRPCError({code: 'FORBIDDEN', message: "You are not allowed to delete this message"});
      }
        
      
      const updatedMessage = await db
        .update(messages)
        .set({
          content: "This message has been deleted.", 
          modifiedAt: new Date()
        }).returning().get();

      if(!updatedMessage) {
        throw new TRPCError({code: "INTERNAL_SERVER_ERROR", message: "Something went wrong when deleting the message"});
      }

      return {success: true, resText: updatedMessage.content};
  }),


  infinite: protectedProcedure //need to edit
>>>>>>> origin/dev
    .input(
      z.object({
        channelId: z.number(),
        cursor: z.date().nullish(),
        take: z.number().min(1).max(50).nullish(),
      }),
    )
    .query(async ({ input }) => {
      const take = input.take ?? 20;
      const cursor = input.cursor;

      const page = await db.query.messages.findMany({
        orderBy: (fields, ops) => ops.desc(fields.createdAt),
        where: (fields, ops) =>
          ops.and(
            ops.eq(fields.channelId, input.channelId),
            cursor ? ops.lte(fields.createdAt, cursor) : undefined,
          ),
        limit: take + 1,
      });

      const items = page.reverse();
      let nextCursor: typeof cursor | null = null;
      if (items.length > take) {
        const prev = items.shift();
        nextCursor = prev!.createdAt;
      }

      return {
        items,
        nextCursor,
      };
    }),

<<<<<<< HEAD
  onCreateMessage: publicProcedure
=======
  onCreateMessage: protectedProcedure //working on
>>>>>>> origin/dev
    .input(
      z.object({
        channelId: z.number(),
        lastEventId: z.string().nullish(),
      }),
    )
    .subscription(async function* (opts) {
      const iterable = ee.toIterable('createMessage', {
        signal: opts.signal,
      });

      let lastMessageCreatedAt: Date | null = null;

      if (opts.input.lastEventId) {
        const result = await db
          .select()
          .from(messages)
          .where(eq(messages.id, Number(opts.input.lastEventId)));

        if (!result) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch last message' });
        }

        lastMessageCreatedAt = result[0]?.createdAt ?? null;
      }

      const conditions = [eq(messages.channelId, opts.input.channelId)];
      if (lastMessageCreatedAt) {
        conditions.push(gt(messages.createdAt, lastMessageCreatedAt));
      }

      const newMessages = await db
        .select()
        .from(messages)
        .where(and(...conditions))
        .orderBy(messages.createdAt);

      function* maybeYield(message: {
        id: number;
        channelId: number;
        createdAt: Date;
        modifiedAt: Date;
        content: string;
        userId?: number;
        userName?: string;
      }) {
        if (Number(message.channelId) !== opts.input.channelId) return;
        if (lastMessageCreatedAt && message.createdAt <= lastMessageCreatedAt) return;

        yield tracked(String(message.id), { ...message });
        lastMessageCreatedAt = message.createdAt;
      }

      for (const message of newMessages) {
        yield* maybeYield(message);
      }

      for await (const [channelId, message] of iterable) {
        yield* maybeYield(message);
      }
    }),
});
