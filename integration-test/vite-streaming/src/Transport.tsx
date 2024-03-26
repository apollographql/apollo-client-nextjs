/**
 * The logic for the transform stream was strongly inspired by `createHeadInsertionTransformStream`
 * from https://github.com/vercel/next.js/blob/6481c92038cce43056005c07f80f2938faf29c29/packages/next/src/server/node-web-streams-helper.ts
 *
 * released under a MIT license (https://github.com/vercel/next.js/blob/6481c92038cce43056005c07f80f2938faf29c29/packages/next/license.md)
 * by Vercel, Inc., marked Copyright (c) 2023 Vercel, Inc.
 */

import { WrapApolloProvider } from "@apollo/client-react-streaming";
import { buildManualDataTransport } from "@apollo/client-react-streaming/manual-transport";
import { renderToString } from "react-dom/server";
import * as React from "react";

const InjectionContext = React.createContext<
  (callback: () => React.ReactNode) => void
>(() => {});
export const InjectionContextProvider = InjectionContext.Provider;

export const WrappedApolloProvider = WrapApolloProvider(
  buildManualDataTransport({
    useInsertHtml() {
      return React.useContext(InjectionContext);
    },
  })
);

export function createTransport(): {
  transformStream: TransformStream;
  injectIntoStream: (callback: () => React.ReactNode) => void;
} {
  let queuedInjections: Array<() => React.ReactNode> = [];

  async function renderInjectedHtml() {
    const injections = [...queuedInjections];
    queuedInjections = [];
    return renderToString(
      <>
        {injections.map((callback, i) => (
          <React.Fragment key={i}>{callback()}</React.Fragment>
        ))}
      </>
    );
  }

  let headInserted = false;
  let currentlyStreaming = false;
  const textDecoder = new TextDecoder();

  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      // While react is flushing chunks, we don't apply insertions
      if (currentlyStreaming) {
        controller.enqueue(chunk);
        return;
      }

      if (!headInserted) {
        const content = textDecoder.decode(chunk, { stream: true });
        const index = content.indexOf("</head>");
        if (index !== -1) {
          const insertedHeadContent =
            content.slice(0, index) +
            (await renderInjectedHtml()) +
            content.slice(index);
          controller.enqueue(new TextEncoder().encode(insertedHeadContent));
          currentlyStreaming = true;
          setImmediate(() => {
            currentlyStreaming = false;
          });
          headInserted = true;
        } else {
          controller.enqueue(chunk);
        }
      } else {
        controller.enqueue(
          new TextEncoder().encode(await renderInjectedHtml())
        );
        controller.enqueue(chunk);
        currentlyStreaming = true;
        setImmediate(() => {
          currentlyStreaming = false;
        });
      }
    },
  });

  return {
    transformStream,
    injectIntoStream: (callback) => queuedInjections.push(callback),
  };
}
