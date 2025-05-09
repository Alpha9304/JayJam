import { tracked, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from "../../lib/trpc";
import { currentlyTyping, ee } from './chatRouter';
import { channels, finalizedEvents, messages, pendingEvents, users, messageReactions } from '../../db/schema';
import { db } from '../../db';
import { and, eq, gt, sql } from 'drizzle-orm';

// Emoji Reaction
const reactionInput = z.object({
  messageId: z.number(),
  emoji:     z.string().min(1).max(8),
});

type ReactionUpdatePayload = {
  emoji: string;
  delta: 1 | -1;
  userId: number;
  messageId: number; 
};


import { isBuffer } from 'node:util';

//replace PostType with {channelId: number, createdAt: Date, modifiedAt: Date, content: String}
export const messageRouter = router({
  createMessage: protectedProcedure
    .input(
      z.object({
        channelId: z.number(), //will either be a finalizedEventId or pendingEventId
        content: z.string().trim().min(1),
      }),
    )
    .mutation(async ( {ctx, input}) => {
      const { channelId, content } = input;

      const session = ctx.session;

      if(!session) {
        throw new TRPCError({code: 'UNAUTHORIZED', message: "Invalid session"}); 
      }
    
      const message = await db
        .insert(messages)
        .values({
          channelId,
          userId: session.userId,
          content,
          createdAt: new Date(),
          modifiedAt: new Date()
        })
       .returning().get();

       if(!message) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: "Something went wrong when forming the message"}); 
       }
        
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId));

      if(!users) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: "User not found"}); 
      }

      const channelTyping = currentlyTyping[channelId];
      if (channelTyping) {
        delete channelTyping[user[0].name]; //I think this is to show "name" is typing... ?
        ee.emit('isTypingUpdate', String(channelId), channelTyping);
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const defMessage = message!;
      ee.emit('createMessage', String(channelId), defMessage); //emits a createMessage event when a message is made
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
        })
        .where(eq(messages.id, id))
        .returning().get();

      if(!updatedMessage) {
        throw new TRPCError({code: "INTERNAL_SERVER_ERROR", message: "Something went wrong when deleting the message"});
      }

      // Emit message update event
      ee.emit('messageUpdate', String(messageChannelId), {
        id: updatedMessage.id,
        content: updatedMessage.content,
        modifiedAt: updatedMessage.modifiedAt
      });

      return {success: true, resText: updatedMessage.content};
    }),
  editMessage: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        content: z.string().trim().min(1),
      }),
    )
    .output(z.object({success: z.boolean(), resText: z.string()}))
    .mutation(async ( {ctx, input}) => {
      const { id, content } = input;

      const session = ctx.session;

      if(!session) {
        throw new TRPCError({code: 'UNAUTHORIZED', message: "Invalid session"}); 
      }
    
      const foundMessage = await db
        .select()
        .from(messages)
        .where(eq(messages.id, id));

      if(!foundMessage || foundMessage.length === 0) {
        throw new TRPCError({code: 'NOT_FOUND', message: "Message not found"}); 
      }

      const message = foundMessage[0];
      const messageChannelId = message.channelId;

      // Only the author of the message can edit it
      if(message.userId !== session.userId) {
        throw new TRPCError({code: 'FORBIDDEN', message: "You are not allowed to edit this message"});
      }
      
      // Cannot edit deleted messages
      if(message.content === "This message has been deleted.") {
        throw new TRPCError({code: 'BAD_REQUEST', message: "Cannot edit deleted messages"});
      }
      
      const updatedMessage = await db
        .update(messages)
        .set({
          content, 
          modifiedAt: new Date()
        })
        .where(eq(messages.id, id))
        .returning().get();

      if(!updatedMessage) {
        throw new TRPCError({code: "INTERNAL_SERVER_ERROR", message: "Something went wrong when editing the message"});
      }

      // Emit message update event
      ee.emit('messageUpdate', String(messageChannelId), {
        id: updatedMessage.id,
        content: updatedMessage.content,
        modifiedAt: updatedMessage.modifiedAt
      });

      return { success: true, resText: "Successfully edited message" };
    }),


  infinite: protectedProcedure //need to edit
    .input(
      z.object({
        channelId: z.number(),
        cursor: z.date().nullish(),
        take: z.number().min(1).max(50).nullish(),
      }),
    )
    .query(async (opts) => {
      const take = opts.input.take ?? 20;
      const cursor = opts.input.cursor;

      const page = await db.query.messages.findMany({
        orderBy: (fields, ops) => ops.desc(fields.createdAt),
        where: (fields, ops) =>
          ops.and(
            ops.eq(fields.channelId, opts.input.channelId),
            cursor ? ops.lte(fields.createdAt, cursor) : undefined,
          ),
        limit: take + 1,
      });

      // Fetch reactions for all messages in the page
      const messageIds = page.map(msg => msg.id);
      const reactionsRaw = await db
        .select({
          messageId: messageReactions.messageId,
          emoji: messageReactions.emoji,
          count: sql<number>`COUNT(*)`.as('count'),
          reactedByMe: sql<number>`
            SUM(CASE WHEN ${messageReactions.userId} = ${opts.ctx.session!.userId} THEN 1 ELSE 0 END)
          `.as('reactedByMe')
        })
        .from(messageReactions)
        .where(sql`${messageReactions.messageId} IN (${messageIds})`)
        .groupBy(messageReactions.messageId, messageReactions.emoji);

      // Group reactions by messageId
      const reactionsByMessage = reactionsRaw.reduce((acc, r) => {
        if (!acc[r.messageId]) {
          acc[r.messageId] = {};
        }
        acc[r.messageId][r.emoji] = {
          count: Number(r.count),
          reactedByMe: Number(r.reactedByMe) > 0,
        };
        return acc;
      }, {} as Record<number, Record<string, { count: number; reactedByMe: boolean }>>);

      // Add reactions to messages
      const items = page.reverse().map(msg => ({
        ...msg,
        reactions: reactionsByMessage[msg.id] || {},
      }));

      let nextCursor: typeof cursor | null = null;
      if (items.length > take) {
        const prev = items.shift();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        nextCursor = prev!.createdAt;
      }
      return {
        items,
        nextCursor,
      };
    }),

  onCreateMessage: protectedProcedure //working on
    .input(
      z.object({
        channelId: z.number(),
        // lastEventId is the last event id that the client has received
        // On the first call, it will be whatever was passed in the initial setup
        // If the client reconnects, it will be the last event id that the client received
        lastEventId: z.string().nullish(), //nullish includes an empty field, explicitly null, or undefined
      }),
    )
    .subscription(async function* (opts) {
      // We start by subscribing to the event emitter so that we don't miss any new events while fetching
      const iterable = ee.toIterable('createMessage', {
        signal: opts.signal,
      });

      // Fetch the last message createdAt based on the last event id
      let lastMessageCreatedAt = await (async () => {
        const lastEventId = opts.input.lastEventId;
        if (!lastEventId) return null;

        const itemsById = await db
                                .select()
                                .from(messages)
                                .where(eq(messages.id, Number(lastEventId)));
        
        if(!itemsById) {
          throw new TRPCError({code: "INTERNAL_SERVER_ERROR", message: "Something went wrong when fetch the last message."})
        }

        const itemById = itemsById[0];
        return itemById?.createdAt ?? null;
      })();
                                
      const conditions = [eq(messages.channelId, opts.input.channelId)];

      if (lastMessageCreatedAt) {
        conditions.push(gt(messages.createdAt, lastMessageCreatedAt));
      }

      const newMessagesSinceLastMessage = await db
                                              .select()
                                              .from(messages)
                                              .where(and(...conditions))
                                              .orderBy(messages.createdAt);

      async function* maybeYield(message: {id: number, userId: number, channelId: number, createdAt: Date, modifiedAt: Date, content: String}) {
        if (Number(message.channelId) !== opts.input.channelId) {
          // ignore posts from other channels - the event emitter can emit from other channels
          return;
        }
        if (lastMessageCreatedAt && message.createdAt <= lastMessageCreatedAt) {
          // ignore posts that we've already sent - happens if there is a race condition between the query and the event emitter
          return;
        }

        // Fetch reactions for this message
        const reactionsRaw = await db
          .select({
            emoji: messageReactions.emoji,
            count: sql<number>`COUNT(*)`.as('count'),
            reactedByMe: sql<number>`
              SUM(CASE WHEN ${messageReactions.userId} = ${opts.ctx.session!.userId} THEN 1 ELSE 0 END)
            `.as('reactedByMe')
          })
          .from(messageReactions)
          .where(eq(messageReactions.messageId, message.id))
          .groupBy(messageReactions.emoji);


      const reactions = reactionsRaw.reduce((acc, r) => {
        acc[r.emoji] = {
          count: Number(r.count),
          reactedByMe: Number(r.reactedByMe) > 0,
        };
        return acc;
      }, {} as Record<string, { count: number; reactedByMe: boolean }>);

      yield tracked(String(message.id), {
        id: message.id,
        userId: message.userId,
        channelId: message.channelId,
        content: message.content,
        createdAt: message.createdAt,
        modifiedAt: message.modifiedAt,
        reactions,
      });

        // update the cursor so that we don't send this post again
        lastMessageCreatedAt = message.createdAt;
      }

      // yield the posts we fetched from the db
      for (const message of newMessagesSinceLastMessage) {
        for await (const enriched of maybeYield(message)) {
          yield enriched;
        }
      }

      // yield any new messages from the event emitter
      for await (const [channelId, message] of iterable) {
        for await (const enriched of maybeYield(message)) {
          yield enriched;
        }
      }      
    }),

    // Emoji Reactions
    addReaction: protectedProcedure
    .input(reactionInput)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session!;

      // find the message so we can learn its channelId
      const msg = await db
        .select({ channelId: messages.channelId })
        .from(messages)
        .where(eq(messages.id, input.messageId))
        .get();

      if (!msg) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Message missing' });
      }

      // insert; ignore duplicates thanks to the composite PK
      const inserted = await db
        .insert(messageReactions)
        .values({ ...input, userId })
        .onConflictDoNothing()
        .run();                    

      if (inserted.changes) {
        const payload: ReactionUpdatePayload = {
          messageId: input.messageId,
          emoji: input.emoji,
          delta: 1,
          userId,
        };
        ee.emit('reactionUpdate', String(msg.channelId), payload);      }
      return { ok: true };
    }),

  removeReaction: protectedProcedure
    .input(reactionInput)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session!;

      const msg = await db
        .select({ channelId: messages.channelId })
        .from(messages)
        .where(eq(messages.id, input.messageId))
        .get();

      if (!msg) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Message missing' });
      }

      const deleted = await db
        .delete(messageReactions)
        .where(
          and(
            eq(messageReactions.messageId, input.messageId),
            eq(messageReactions.userId,   userId),
            eq(messageReactions.emoji,    input.emoji),
          ),
        )
        .run();                    // { changes: number }

      if (deleted.changes) {
        const payload: ReactionUpdatePayload = {
          messageId: input.messageId,
          emoji: input.emoji,
          delta: -1,
          userId,
        };
        ee.emit('reactionUpdate', String(msg.channelId), payload);
      }
      return { ok: true };
    }),

  onReactionUpdate: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .subscription(async function* (opts) {
      // forward any historical backlog if you like (optional) …

      // live stream
      for await (const [chan, rawData] of ee.toIterable('reactionUpdate', {
        signal: opts.signal,
      })) {
        if (chan === String(opts.input.channelId)) {
          const data = rawData as ReactionUpdatePayload;
          yield tracked(`${data.messageId}-${data.emoji}`, data);
        }
      }
    }),

  onMessageUpdate: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .subscription(async function* (opts) {
      for await (const [chan, rawData] of ee.toIterable('messageUpdate', {
        signal: opts.signal,
      })) {
        if (chan === String(opts.input.channelId)) {
          const data = rawData as { id: number; content: string; modifiedAt: Date };
          yield tracked(String(data.id), data);
        }
      }
    }),

    toggleReaction: protectedProcedure
    .input(z.object({
      messageId: z.number(),
      emoji: z.string(),
      remove: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { messageId, emoji, remove } = input;
      const userId = ctx.session?.userId;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
  
      const channelData = await db
        .select({ channelId: messages.channelId })
        .from(messages)
        .where(eq(messages.id, messageId))
        .get();
  
      if (!channelData) throw new TRPCError({ code: 'NOT_FOUND' });
  
      if (remove) {
        await db.delete(messageReactions)
          .where(and(
            eq(messageReactions.messageId, messageId),
            eq(messageReactions.emoji, emoji),
            eq(messageReactions.userId, userId),
          ))
          .run();
      } else {
        // First check if the user has already reacted with this emoji
        const existingReaction = await db
          .select()
          .from(messageReactions)
          .where(and(
            eq(messageReactions.messageId, messageId),
            eq(messageReactions.emoji, emoji),
            eq(messageReactions.userId, userId),
          ))
          .get();

        if (!existingReaction) {
          await db.insert(messageReactions).values({
            messageId,
            emoji,
            userId,
          }).onConflictDoNothing().run();
        }
      }
  
      const msg = await db
        .select({ channelId: messages.channelId })
        .from(messages)
        .where(eq(messages.id, messageId))
        .get();

      if (!msg) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Message missing' });
      }

      const payload: ReactionUpdatePayload = {
        messageId: input.messageId,
        emoji: input.emoji,
        delta: remove ? -1 : 1,
        userId,
      };
      ee.emit('reactionUpdate', String(msg.channelId), payload);
  
      return { success: true };
    }),
  
  searchMessages: publicProcedure
    .input(z.object({
      channelId: z.number(),
      keyword: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const { channelId, keyword } = input;
      return await db.query.messages.findMany({
        where: (msg, { and, eq, like }) =>
          and(
            eq(msg.channelId, channelId),
            like(msg.content, `%${keyword}%`)
          ),
        orderBy: (msg, { asc }) => [asc(msg.createdAt)],
      });
    }),

});