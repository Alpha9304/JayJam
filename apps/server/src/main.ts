import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./router/app";
import cors from "cors";
import cookieParser from "cookie-parser"

import { generateOpenApiDocument } from 'trpc-to-openapi';
import { createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { createCallerFactory, createTRPCContext } from "./lib/trpc";

//for exposing trpc procedures as REST endpoints
export const openApiDocument = generateOpenApiDocument(appRouter, {
    title: 'tRPC OpenAPI',
    version: '1.0.0',
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_FALLBACK_URL || 'http://localhost:4002',
});

const app = express();

app.use(cors({ 
    origin: [
        process.env.NEXT_PUBLIC_FRONTEND_URL!, process.env.NEXT_PUBLIC_FRONTEND_FALLBACK_URL!, 'http://localhost:3002',
    ],
    credentials: true,
    methods:["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"]
}));

app.use(cookieParser()) // DO NOT DELETE THIS

const createCaller = createCallerFactory(appRouter);
// SSE subscription endpoint
app.get('/trpc-sse', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      if (req.headers.accept !== 'text/event-stream') {
        res.status(400).send('This endpoint only supports SSE subscriptions.');
        return;
      }
  
      const path = req.query.path as string;
      const input = req.query.input ? JSON.parse(req.query.input as string) : undefined;
  
      console.log('[SSE] Incoming request for path:', path);
      console.log('[SSE] Input:', input);

      const context = await createTRPCContext({
        req,
        res,
        info: {
          type: 'subscription',
          accept: 'application/jsonl',
          isBatchCall: false,
          calls: [],
          connectionParams: {},
          signal: new AbortController().signal,
        },
      });
  
      const caller = createCaller(context);
  
      const procedure = path.split('.').reduce((acc: any, part) => acc?.[part], appRouter);
  
      if (!procedure?.subscribe) {
        console.error('[SSE] Subscription procedure not found for:', path);
        res.status(404).send('Subscription procedure not found.');
      }
  
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
  
      const sub = procedure.subscribe({
        input,
        next(data: unknown) {
          res.write(`data: ${JSON.stringify({ result: { data } })}\n\n`);
        },
        error(err: unknown) {
          console.error('[SSE] Subscription error:', err);
          res.write(`event: error\ndata: ${JSON.stringify({ message: err.message || err })}\n\n`);
        },
        complete() {
          res.end();
        },
      });
  
      req.on('close', () => {
        sub.unsubscribe();
        res.end();
      });
    } catch (err) {
      console.error('[SSE] Fatal error:', err);
      res.status(500).send('Internal Server Error');
    }
  });
  

app.use("/trpc", trpcExpress.createExpressMiddleware({
    router: appRouter,
    // add context for user auth
    createContext: createTRPCContext
}));

app.use(createOpenApiExpressMiddleware({router: appRouter, createContext: createTRPCContext})); //expose trpc procedures as rest endpoints for testing

const PORT: number = parseInt(process.env.PORT || '4002', 10);
app.listen(PORT, () => {
    console.log(`Server running on Port: ${PORT}`)
})

