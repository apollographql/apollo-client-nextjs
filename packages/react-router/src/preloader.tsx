import type { CreateServerLoaderArgs } from "react-router/route-module";
import type { ApolloClient } from "./ApolloClient.js";
import type { QueryRef } from "@apollo/client/react/index.js";
import type {
  PreloadTransportedQueryFunction,
  ReadableStreamLinkEvent,
  TransportedQueryRef,
} from "@apollo/client-react-streaming";
import {
  createTransportedQueryPreloader,
  isTransportedQueryRef,
  reviveTransportedQueryRef,
} from "@apollo/client-react-streaming";
import type { Promiscade } from "promiscade";
import { promiscadeToReadableStream, streamToPromiscade } from "promiscade";
import type { unstable_SerializesTo } from "react-router";
import type { JsonString } from "@apollo/client-react-streaming/stream-utils";

type MarkedForSerialization<T> =
  T extends TransportedQueryRef<infer Data, infer Variables>
    ? unstable_SerializesTo<QueryRef<Data, Variables>>
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
    stream?: never;
    promiscade: EventPromiscade;
  };
};

function isPromiscaded(
  queryRef: TransportedQueryRef | PromiscadedRef
): queryRef is PromiscadedRef {
  return "promiscade" in queryRef.$__apollo_queryRef;
}

/**
 * This function is used to convert a stream ref to a promiscaded ref
 *
 * **modifies the object in place**
 */
function replaceStreamWithPromiscade(queryRef: TransportedQueryRef) {
  const typed = queryRef as unknown as PromiscadedRef;
  // the stream will be tee'd so it can be used in the same environment,
  // but also transported over the wire in the form of a promiscade
  const stream = queryRef.$__apollo_queryRef.stream;
  typed.$__apollo_queryRef.promiscade = streamToPromiscade(stream);
  delete typed.$__apollo_queryRef.stream;
}

/**
 * This function is used to convert a promiscaded query ref back to a stream ref
 *
 * **returns a new object** - this is important because modifying the original object
 * could result in poor timing and have the modified object be sent over the wire instead
 * of the one with the promiscade
 */
function promiscadedRefToStreamRef(
  queryRef: PromiscadedRef
): TransportedQueryRef {
  const { promiscade: _, ...restRef } = queryRef.$__apollo_queryRef;
  return {
    ...queryRef,
    $__apollo_queryRef: {
      ...restRef,
      stream: promiscadeToReadableStream(
        queryRef.$__apollo_queryRef.promiscade
      ),
    },
  };
}

const hydratedRefs = new WeakMap<PromiscadedRef, TransportedQueryRef>();
/**
 * If `obj` is a Promiscaded Ref, creates a new "live" QueryRef
 * If `obj` is a Transported Ref, converts it to a "live" QueryRef
 * Returns other values untouched
 */
export function hydrateIfNecessary(obj: unknown, client: ApolloClient) {
  if (isTransportedQueryRef(obj)) {
    if (isPromiscaded(obj)) {
      if (!hydratedRefs.has(obj)) {
        hydratedRefs.set(obj, promiscadedRefToStreamRef(obj));
      }
      obj = hydratedRefs.get(obj)!;
    }
    reviveTransportedQueryRef(obj as TransportedQueryRef, client);
  }
  return obj;
}
