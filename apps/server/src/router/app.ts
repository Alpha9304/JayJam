//contains functions we want to expose to frontend
//this is the index route with functions from all routers

import { trpc } from "../lib/trpc";
import { authRouter } from "./auth/authRouter";
import { sisLinkRouter } from "./sisLinkRouter";
import { helloWorldRouter } from "./helloWorldRouter";
import { groupRouter } from "./groupRouter";
import { googleRouter } from "./auth/googleRouter";
import { testRouter } from "./auth/testRouter";
import { eventsRouter } from "./eventsRouter";
import { profileRouter } from "./profileRouter";
import { settingsRouter } from "./settingsRouter";
import { testToolsRouter } from "./testToolsRouter";
import { chatRouter } from "./group-chat/chatRouter";
import { messageRouter } from "./group-chat/messageRouter";

export const appRouter = trpc.router({
  helloWorld: helloWorldRouter,
  auth: authRouter,
  sisLink: sisLinkRouter,
  group: groupRouter,
  events: eventsRouter,
  profile: profileRouter,
  settings: settingsRouter,
  google: googleRouter,
  test: testRouter,
  testTools: testToolsRouter,
  chat: chatRouter,
  message: messageRouter
});

export type AppRouter = typeof appRouter;
