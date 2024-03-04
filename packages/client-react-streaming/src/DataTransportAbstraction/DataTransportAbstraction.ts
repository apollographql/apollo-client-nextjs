import type React from "react";
import type {
  FetchResult,
  Observable,
  WatchQueryOptions,
} from "@apollo/client/index.js";
import { createContext } from "react";

interface DataTransportAbstraction {
  /**
   * This hook should always return the first value it was called with.
   *
   * If used in the browser and SSR happened, it should return the value passed to it on the server.
   */
  useStaticValueRef<T>(value: T): { current: T };
}

export const DataTransportContext =
  /*#__PURE__*/ createContext<DataTransportAbstraction | null>(null);

export type DataTransportProviderImplementation<
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtraProps = {},
> = React.FC<
  {
    /** will be present in the Browser */
    onQueryEvent?: (event: QueryEvent) => void;
    /** will be present in the Browser */
    rerunSimulatedQueries?: () => void;
    /** will be present during SSR */
    registerDispatchRequestStarted?: (
      callback: (query: {
        event: Extract<QueryEvent, { type: "started" }>;
        observable: Observable<Exclude<QueryEvent, { type: "started" }>>;
      }) => void
    ) => void;
    /** will always be present */
    children: React.ReactNode;
  } & ExtraProps
>;

export type TransportIdentifier = string & { __transportIdentifier: true };

export type QueryEvent =
  | {
      type: "started";
      options: WatchQueryOptions;
      id: TransportIdentifier;
    }
  | {
      type: "data";
      id: TransportIdentifier;
      result: FetchResult;
    }
  | {
      type: "error";
      id: TransportIdentifier;
      // for now we don't transport the error itself, as it might leak some sensitive information
      // error: Error;
    }
  | {
      type: "complete";
      id: TransportIdentifier;
    };
