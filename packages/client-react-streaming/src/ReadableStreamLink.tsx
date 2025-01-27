import { ApolloLink, Observable } from "@apollo/client/index.js";
import type { FetchResult } from "@apollo/client/index.js";

export type ReadableStreamLinkEvent =
  | { type: "next"; value: FetchResult }
  | { type: "completed" }
  | { type: "error" };

interface InternalContext {
  [teeToReadableStreamKey]?: ReadableStreamDefaultController<ReadableStreamLinkEvent>;
  [readFromReadableStreamKey]?: ReadableStream<ReadableStreamLinkEvent>;
}

const teeToReadableStreamKey = Symbol.for(
  "apollo.tee.readableStreamController"
);
const readFromReadableStreamKey = Symbol.for("apollo.read.readableStream");

/**
 * Apply to a context that will be passed to a link chain containing `TeeToReadableStreamLink`.
 * @param controller
 * @param context
 * @returns
 */
export function teeToReadableStream<T extends Record<string, any>>(
  controller: ReadableStreamDefaultController<ReadableStreamLinkEvent>,
  context: T
): T & InternalContext {
  return Object.assign(context, {
    [teeToReadableStreamKey]: controller,
  });
}

/**
 * Apply to a context that will be passed to a link chain containing `ReadFromReadableStreamLink`.
 * @param readableStream
 * @param context
 * @returns
 */
export function readFromReadableStream<T extends Record<string, any>>(
  readableStream: ReadableStream<ReadableStreamLinkEvent>,
  context: T
): T & InternalContext {
  return Object.assign(context, {
    [readFromReadableStreamKey]: readableStream,
  });
}

/**
 * A link that allows the request to be cloned into a readable stream, e.g. for
 * transport of multipart responses from RSC or a server loader to the browser.
 */
export class TeeToReadableStreamLink extends ApolloLink {
  constructor() {
    super((operation, forward) => {
      const context = operation.getContext() as InternalContext;

      const controller = context[teeToReadableStreamKey];

      if (controller) {
        const tryClose = () => {
          try {
            controller.close();
          } catch {
            // maybe we already tried to close the stream, nothing to worry about
          }
        };
        return new Observable((observer) => {
          const subscription = forward(operation).subscribe({
            next(result) {
              controller.enqueue({ type: "next", value: result });
              observer.next(result);
            },
            error(error) {
              controller.enqueue({ type: "error" });
              tryClose();
              observer.error(error);
            },
            complete() {
              controller.enqueue({ type: "completed" });
              tryClose();
              observer.complete();
            },
          });

          return () => {
            tryClose();
            subscription.unsubscribe();
          };
        });
      }

      return forward(operation);
    });
  }
}

/**
 * A link that allows the response to be read from a readable stream, e.g. for
 * hydration of a multipart response from RSC or a server loader in the browser.
 */

export class ReadFromReadableStreamLink extends ApolloLink {
  constructor() {
    super((operation, forward) => {
      const context = operation.getContext() as InternalContext;

      const eventSteam = context[readFromReadableStreamKey];
      if (eventSteam) {
        return new Observable((observer) => {
          let aborted = false as boolean;
          const reader = (() => {
            try {
              return eventSteam.getReader();
            } catch {
              /**
               * The reader could not be created, usually because the stream has
               * already been consumed.
               * This would be the case if we call `refetch` on a queryRef that has
               * the `readFromReadableStreamKey` property in context.
               * In that case, we want to do a normal network request.
               */
            }
          })();

          if (!reader) {
            // if we can't create a reader, we want to do a normal network request
            const subscription = forward(operation).subscribe(observer);
            return () => subscription.unsubscribe();
          }
          consume(reader);

          let onAbort = () => {
            aborted = true;
            reader.cancel();
          };

          return () => onAbort();

          async function consume(
            reader: ReadableStreamDefaultReader<ReadableStreamLinkEvent>
          ) {
            let event:
              | ReadableStreamReadResult<ReadableStreamLinkEvent>
              | undefined = undefined;
            while (!aborted && !event?.done) {
              event = await reader.read();
              if (aborted) break;
              if (event.value) {
                switch (event.value.type) {
                  case "next":
                    observer.next(event.value.value);
                    break;
                  case "completed":
                    observer.complete();
                    break;
                  case "error":
                    // in case a network error happened on the sending side,
                    if (process.env.REACT_ENV === "ssr") {
                      // we want to fail SSR for this tree
                      observer.error(
                        new Error(
                          "Error from event stream. Redacted for security concerns."
                        )
                      );
                    } else {
                      // we want to retry the operation on the receiving side
                      onAbort();
                      const subscription =
                        forward(operation).subscribe(observer);
                      onAbort = () => subscription.unsubscribe();
                    }
                    break;
                }
              }
            }
          }
        });
      }

      return forward(operation);
    });
  }
}
