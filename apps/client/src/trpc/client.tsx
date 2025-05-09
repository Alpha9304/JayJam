"use client";
// ^-- to make sure we can mount the Provider from a server component
<<<<<<< HEAD
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, splitLink } from '@trpc/client';
import { sseLink } from '@/trpc/sseLink';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';
import { makeQueryClient } from './query-client';
import type { AppRouter } from '../../../server/src/router/app';
import superjson from 'superjson';
=======
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, httpSubscriptionLink, loggerLink, splitLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import { makeQueryClient } from "./query-client";
import type { AppRouter } from "../../../server/src/router/app";
import superjson from "superjson";
>>>>>>> origin/dev

const getBaseUrl = () => {
  // default to localhost:4002
  let baseUrl = "http://localhost:4002";
  // if there is a backend url
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  } else if (process.env.NEXT_PUBLIC_BACKEND_FALLBACK_URL) {
    baseUrl = process.env.NEXT_PUBLIC_BACKEND_FALLBACK_URL;
  }
  return `${baseUrl}/trpc`;
};

export const trpc = createTRPCReact<AppRouter>();

let clientQueryClientSingleton: QueryClient;
function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= makeQueryClient());
}

export function TRPCProvider(
  props: Readonly<{
    children: React.ReactNode;
  }>
) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();
/*
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        // Add debug logging link
        () => {
          return ({ next, op }) => {
            console.log(`tRPC operation started: ${op.type} - ${op.path}`);
            
            // Call next and then apply console logs without modifying the behavior
            const observable = next(op);
            
            // Subscribe to the observable's events manually
            const originalSubscribe = observable.subscribe.bind(observable);
            observable.subscribe = (observer) => {
              console.log(`Subscribing to ${op.path}`);
              
              // Create a new observer that logs and forwards events
              return originalSubscribe({
                next: (data) => {
                  console.log(`Data from ${op.path}:`, data);
                  observer.next?.(data);
                },
                error: (err) => {
                  console.error(`Error from ${op.path}:`, err);
                  observer.error?.(err);
                },
                complete: () => {
                  console.log(`Complete from ${op.path}`);
                  observer.complete?.();
                }
              });
            };
            
            return observable;
          };
        },
        loggerLink(),
        splitLink({
          condition: (op) => {
            console.log(`Checking condition for operation: ${op.type} - ${op.path}`);
            return op.type === "subscription";
          },
          true: httpSubscriptionLink({
            url: getBaseUrl(),
            transformer: superjson,
            eventSourceOptions: {
              withCredentials: true,
              onopen: (event: Event) => {
                console.log('EventSource connection opened:', event);
              },
              onerror: (event: Event) => {
                console.error('EventSource connection error:', event);
              },
            },
          }),
          false: httpBatchLink({
            transformer: superjson,
            url: getBaseUrl(),
            fetch(url, options) {
              return fetch(url, {
                ...options,
                credentials: "include",
              });
            },
          }),
        }),
      ],
    })
  );
  */
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        splitLink({
          condition: (op) => op.type === 'subscription',
          true: sseLink({ url: `${getBaseUrl()}/trpc` }),
          false: httpBatchLink({
            url: `${getBaseUrl()}/trpc`,
            transformer: superjson,
            fetch(url, options) {
              return fetch(url, {
                ...options,
                credentials: 'include',
              });
            },
          }),
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
