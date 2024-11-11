import { ApolloLink, Observable } from "@apollo/client/index.js";
import type { FetchResult } from "@apollo/client/index.js";

export type StreamLinkEvent =
  | { type: "next"; value: FetchResult }
  | { type: "completed" }
  | { type: "error" };

interface InternalContext {
  [teeToReadableStreamKey]?: ReadableStreamDefaultController<StreamLinkEvent>;
  [readFromReadableStreamKey]?: ReadableStream<StreamLinkEvent>;
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
  controller: ReadableStreamDefaultController<StreamLinkEvent>,
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
  readableStream: ReadableStream<StreamLinkEvent>,
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
export const TeeToReadableStreamLink = new ApolloLink((operation, forward) => {
  const context = operation.getContext() as InternalContext;

  const controller = context[teeToReadableStreamKey];

  if (controller) {
    return new Observable((observer) => {
      const subscription = forward(operation).subscribe(
        (result) => {
          controller.enqueue({ type: "next", value: result });
          observer.next(result);
        },
        (error) => {
          controller.enqueue({ type: "error" });
          controller.close();
          observer.error(error);
        },
        () => {
          controller.enqueue({ type: "completed" });
          controller.close();
          observer.complete();
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    });
  }

  return forward(operation);
});

/**
 * A link that allows the response to be read from a readable stream, e.g. for
 * hydration of a multipart response from RSC or a server loader in the browser.
 */
export const ReadFromReadableStreamLink = new ApolloLink(
  (operation, forward) => {
    const context = operation.getContext() as InternalContext;

    const eventSteam = context[readFromReadableStreamKey];
    if (eventSteam) {
      return new Observable((observer) => {
        let aborted = false as boolean;
        const reader = eventSteam.getReader();
        consumeReader();

        return () => {
          aborted = true;
          reader.cancel();
        };

        async function consumeReader() {
          let event: ReadableStreamReadResult<StreamLinkEvent> | undefined =
            undefined;
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
                  observer.error(
                    new Error(
                      "Error from event stream. Redacted for security concerns."
                    )
                  );
                  break;
              }
            }
          }
        }
      });
    }

    return forward(operation);
  }
);