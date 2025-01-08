import type { CreateServerLoaderArgs } from "react-router/route-module";
import type { ApolloClient } from "./ApolloClient.js";
import type { QueryRef } from "@apollo/client/index.js";
import type {
  PreloadTransportedQueryFunction,
  ReadableStreamLinkEvent,
  TransportedQueryRef,
} from "@apollo/client-react-streaming";
import {
  createTransportedQueryPreloader,
  isTransportedQueryRef,
} from "@apollo/client-react-streaming";
import type { Promiscade } from "promiscade";
import { promiscadeToReadableStream, streamToPromiscade } from "promiscade";
// still requires a patch, waiting for https://github.com/remix-run/react-router/pull/12264
import type { SerializesTo } from "react-router/route-module";
import type { JsonString } from "@apollo/client-react-streaming/stream-utils";

type MarkedForSerialization<T> =
  T extends TransportedQueryRef<infer Data, infer Variables>
    ? SerializesTo<QueryRef<Data, Variables>>
    : { [K in keyof T]: MarkedForSerialization<T[K]> };

type ApolloLoader = <LoaderArgs extends CreateServerLoaderArgs<any>>() => <
  ReturnValue,
>(
  loader: (
    args: LoaderArgs & {
      preloadQuery: PreloadTransportedQueryFunction;
    }
  ) => ReturnValue
) => (args: LoaderArgs) => MarkedForSerialization<ReturnValue>;

export function createApolloLoaderHandler(
  makeClient: (request: Request) => ApolloClient
): ApolloLoader {
  return () => (loader) => (args) => {
    const client = makeClient(args.request);
    const preloadQuery = createTransportedQueryPreloader(client);
    const loaded = loader({
      ...args,
      preloadQuery,
    });
    JSON.stringify(loaded, (_key, value) => {
      if (isTransportedQueryRef(value)) {
        replaceStreamWithPromiscade(value);
      }
      return value;
    });
    return loaded as any;
  };
}

// currently, `turbo-stream` cannot stream a `ReadableStream`.
// until https://github.com/jacob-ebey/turbo-stream/pull/51
// is merged or similar functionality is added, we need to
// convert the stream to a cascade of promises
// once that functionality has been added, all this can be removed.

type EventPromiscade = Promiscade<JsonString<ReadableStreamLinkEvent>>;
type PromiscadedRef = Omit<TransportedQueryRef, "$__apollo_queryRef"> & {
  $__apollo_queryRef: Omit<
    TransportedQueryRef["$__apollo_queryRef"],
    "stream"
  > & {
    stream?: TransportedQueryRef["$__apollo_queryRef"]["stream"];
    promiscade: EventPromiscade;
  };
};

export function isPromiscaded(
  queryRef: TransportedQueryRef | PromiscadedRef
): queryRef is PromiscadedRef {
  return "promiscade" in queryRef.$__apollo_queryRef;
}

function replaceStreamWithPromiscade(queryRef: TransportedQueryRef) {
  const typed = queryRef as PromiscadedRef;
  // the stream will be tee'd so it can be used in the same environment,
  // but also transported over the wire in the form of a promiscade
  const [stream1, stream2] = queryRef.$__apollo_queryRef.stream.tee();
  typed.$__apollo_queryRef.promiscade = streamToPromiscade(stream2);
  Object.defineProperty(typed.$__apollo_queryRef, "stream", {
    value: stream1,
    writable: true,
    configurable: true,
    // this stream needs to be available for use in the same environment,
    // but should not be serialized/transported
    enumerable: false,
  });
}

export function replacePromiscadeWithStream(
  queryRef: TransportedQueryRef | PromiscadedRef
) {
  if (queryRef.$__apollo_queryRef.stream) return;
  const typed = queryRef as PromiscadedRef;
  queryRef.$__apollo_queryRef.stream = promiscadeToReadableStream(
    typed.$__apollo_queryRef.promiscade
  );
  // @ts-expect-error this could usually not be deleted
  delete typed.$__apollo_queryRef.promiscade;
}
