// utils/sseLink.ts
import { observable } from '@trpc/server/observable';
import type { TRPCLink } from '@trpc/client';

export const sseLink = (opts: { url: string }): TRPCLink<any> => {
  return () => {
    return ({ op }) => {
      if (op.type !== 'subscription') {
        throw new Error('sseLink only supports subscriptions');
      }

      return observable((emit) => {
        const url = new URL(opts.url);
        url.searchParams.set('input', JSON.stringify(op.input ?? {}));
        url.searchParams.set('path', op.path);

        const es = new EventSource(url.toString(), {
          withCredentials: true,
        });

        es.onmessage = (event) => {
          const parsed = JSON.parse(event.data);
          emit.next(parsed.result); // Assumes { result: { data: ... } } structure
        };

        es.onerror = (event) => {
          const error = new Error('EventSource error') as any;
          error.cause = event;
          emit.error(error);
          es.close();
        };

        return () => {
          es.close();
        };
      });
    };
  };
};
