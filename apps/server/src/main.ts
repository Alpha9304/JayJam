import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./router/app";
import cors from "cors";
import cookieParser from "cookie-parser"

import { generateOpenApiDocument } from 'trpc-to-openapi';
import { createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { createTRPCContext } from "./lib/trpc";

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

