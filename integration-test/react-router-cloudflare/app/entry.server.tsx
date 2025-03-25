import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import type {
  RenderToPipeableStreamOptions,
  RenderToReadableStreamOptions,
} from "react-dom/server";
import { renderToReadableStream } from "react-dom/server";
import { makeClient } from "./apollo";
import { ApolloProvider } from "@apollo/client/react/index.js";

export const streamTimeout = 5_000;
export type RenderOptions = {
  [K in keyof RenderToReadableStreamOptions &
  keyof RenderToPipeableStreamOptions]?: RenderToReadableStreamOptions[K];
};

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext,
  // vercel-specific options, originating from `@vercel/react-router/entry.server.js`
  options?: RenderOptions
) {
  let shellRendered = false;
  const userAgent = request.headers.get("user-agent");
  const client = makeClient(request);

  const abortController = new AbortController();
  setTimeout(() => {
    abortController.abort(`Rendering exceed timeout of ${streamTimeout}ms`);
  }, streamTimeout + 1000);

  responseHeaders.set("Content-Type", "text/html");

  const stream = await renderToReadableStream(
    <ApolloProvider client={client}>
      <ServerRouter
        context={routerContext}
        url={request.url}
        nonce={options?.nonce}
      />
    </ApolloProvider>,
    {
      ...options,
      signal: abortController.signal,
      onError(error: unknown) {
        responseStatusCode = 500;

        if (shellRendered) {
          console.error(error);
        }
      },
    }
  );
  shellRendered = true;

  // BUG: I tried to port this over /integration-test/react-router/app/entry.server.tsx
  // But it breaks with a hydration error if I manually set shouldWaitForAllContent = true.
  // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
  // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
  const shouldWaitForAllContent = (userAgent && isbot(userAgent)) || routerContext.isSpaMode;

  if (shouldWaitForAllContent) {
    await stream.allReady;
  }

  return new Response(stream, {
    headers: responseHeaders,
    status: responseStatusCode,
  })
}
