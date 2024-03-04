import React, { Suspense, useMemo } from "react";
import { runInConditions, testIn } from "../util/runInConditions.js";
import type {
  Cache,
  TypedDocumentNode,
  WatchQueryOptions,
} from "@apollo/client/index.js";
import { gql } from "@apollo/client/index.js";

import "global-jsdom/register";
import assert from "node:assert";
import { afterEach } from "node:test";
import type { QueryEvent } from "./DataTransportAbstraction.js";

runInConditions("browser", "node");

const {
  ApolloClient,
  InMemoryCache,
  WrapApolloProvider,
  DataTransportContext,
} = await import("#bundled");
const { useSuspenseQuery } = await import("@apollo/client/index.js");
const { MockSubscriptionLink } = await import(
  "@apollo/client/testing/index.js"
);
const { render, cleanup } = await import("@testing-library/react");

afterEach(cleanup);

const QUERY_ME: TypedDocumentNode<{ me: string }> = gql`
  query {
    me
  }
`;
const FIRST_REQUEST: WatchQueryOptions = {
  fetchPolicy: "cache-first",
  nextFetchPolicy: undefined,
  notifyOnNetworkStatusChange: false,
  query: QUERY_ME,
};
const EVENT_STARTED: QueryEvent = {
  type: "started",
  id: "1" as any,
  options: FIRST_REQUEST,
};
const FIRST_RESULT = { me: "User" };
const EVENT_DATA: QueryEvent = {
  type: "data",
  id: "1" as any,
  result: { data: FIRST_RESULT },
};
const EVENT_COMPLETE: QueryEvent = {
  type: "complete",
  id: "1" as any,
};
const FIRST_HOOK_RESULT = {
  data: FIRST_RESULT,
  networkStatus: 7,
};

await testIn("node")(
  "`useSuspenseQuery`: data is getting sent to the transport",
  async () => {
    const events: QueryEvent[] = [];
    const staticData: unknown[] = [];

    function useStaticValueRef<T>(current: T) {
      staticData.push(current);
      return { current };
    }

    const Provider = WrapApolloProvider(
      ({ children, registerDispatchRequestStarted }) => {
        registerDispatchRequestStarted!(({ event, observable }) => {
          events.push(event);
          observable.subscribe({
            next: events.push.bind(events),
          });
        });
        return (
          <DataTransportContext.Provider
            value={useMemo(
              () => ({
                useStaticValueRef,
              }),
              []
            )}
          >
            {children}
          </DataTransportContext.Provider>
        );
      }
    );

    const link = new MockSubscriptionLink();
    const client = new ApolloClient({
      connectToDevTools: false,
      cache: new InMemoryCache(),
      link,
    });

    let finishedRenderCount = 0;

    function Child() {
      const { data } = useSuspenseQuery(QUERY_ME);
      finishedRenderCount++;
      return <>{data.me}</>;
    }

    const { findByText } = render(
      <Provider makeClient={() => client}>
        <Suspense fallback={"Fallback"}>
          <Child />
        </Suspense>
      </Provider>
    );

    assert.deepStrictEqual(events, [EVENT_STARTED]);
    assert.deepStrictEqual(staticData, []);

    link.simulateResult({ result: { data: FIRST_RESULT } }, true);

    await findByText("User");

    assert.deepStrictEqual(events, [EVENT_STARTED, EVENT_DATA, EVENT_COMPLETE]);
    assert.deepStrictEqual(
      staticData,
      new Array(finishedRenderCount).fill(FIRST_HOOK_RESULT)
    );
  }
);

await testIn("browser")(
  "`useSuspenseQuery`: data from the transport is used by the hooks",
  async () => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
    let useStaticValueRefStub = <T extends unknown>(): { current: T } => {
      throw new Error("Should not be called yet!");
    };
    let simulateQueryEvent: (event: QueryEvent) => void;

    const Provider = WrapApolloProvider(
      ({ children, onQueryEvent, ..._rest }) => {
        simulateQueryEvent = onQueryEvent!;
        return (
          <DataTransportContext.Provider
            value={useMemo(
              () => ({
                useStaticValueRef() {
                  return useStaticValueRefStub();
                },
              }),
              []
            )}
          >
            {children}
          </DataTransportContext.Provider>
        );
      }
    );

    const client = new ApolloClient({
      connectToDevTools: false,
      cache: new InMemoryCache(),
    });

    let attemptedRenderCount = 0;
    let finishedRenderCount = 0;

    function Child() {
      attemptedRenderCount++;
      const { data } = useSuspenseQuery(QUERY_ME);
      finishedRenderCount++;
      return <>{data.me}</>;
    }

    const { findByText, rerender } = render(
      <Provider makeClient={() => client}></Provider>
    );

    simulateQueryEvent!(EVENT_STARTED);
    rerender(
      <Provider makeClient={() => client}>
        <Suspense fallback={"Fallback"}>
          <Child />
        </Suspense>
      </Provider>
    );

    assert.ok(attemptedRenderCount > 0);
    assert.ok(finishedRenderCount == 0);
    await findByText("Fallback");

    useStaticValueRefStub = () => ({ current: FIRST_HOOK_RESULT as any });
    simulateQueryEvent!(EVENT_DATA);
    simulateQueryEvent!(EVENT_COMPLETE);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await findByText("User");

    assert.ok(attemptedRenderCount > 0);
    // one render to rehydrate the server value
    // one rerender with the actual client value (which is hopefull equal)
    assert.equal(finishedRenderCount, 2);

    assert.deepStrictEqual(JSON.parse(JSON.stringify(client.extract())), {
      ROOT_QUERY: {
        __typename: "Query",
        me: "User",
      },
    });
  }
);
