import React, { Suspense, useMemo } from "react";
import { runInConditions, testIn } from "../util/runInConditions.js";
import {
  Cache,
  TypedDocumentNode,
  WatchQueryOptions,
  gql,
} from "@apollo/client/index.js";
import { MockSubscriptionLink } from "@apollo/client/testing/index.js";
import { render, cleanup } from "@testing-library/react";
import "global-jsdom/register";
import assert from "node:assert";
import { afterEach } from "node:test";

runInConditions("browser", "node");
afterEach(cleanup);

const {
  WrappedApolloClient,
  WrappedInMemoryCache,
  WrapApolloProvider,
  DataTransportContext,
  useSuspenseQuery,
} = await import("@apollo/experimental-nextjs-app-support");

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
const FIRST_RESULT = { me: "User" };
const FIRST_WRITE: Cache.WriteOptions = {
  dataId: "ROOT_QUERY",
  overwrite: false,
  query: QUERY_ME,
  result: FIRST_RESULT,
  variables: {},
};
const FIRST_HOOK_RESULT = {
  data: FIRST_RESULT,
  networkStatus: 7,
};

await testIn("node").only(
  "`useSuspenseQuery`: data is getting sent to the transport",
  async () => {
    const startedRequests: unknown[] = [];
    const requestData: unknown[] = [];
    const staticData: unknown[] = [];

    function useStaticValueRef<T>(current: T) {
      staticData.push(current);
      return { current };
    }

    const Provider = WrapApolloProvider(
      ({
        children,
        registerDispatchRequestData,
        registerDispatchRequestStarted,
      }) => {
        registerDispatchRequestData!(requestData.push.bind(requestData));
        registerDispatchRequestStarted!(
          startedRequests.push.bind(startedRequests)
        );
        return (
          <DataTransportContext.Provider
            value={useMemo(
              () => ({
                useStaticValueRef,
              }),
              [useStaticValueRef]
            )}
          >
            {children}
          </DataTransportContext.Provider>
        );
      }
    );

    const link = new MockSubscriptionLink();
    const client = new WrappedApolloClient({
      cache: new WrappedInMemoryCache(),
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

    assert.deepStrictEqual(startedRequests, [FIRST_REQUEST]);
    assert.deepStrictEqual(requestData, []);
    assert.deepStrictEqual(staticData, []);

    link.simulateResult({ result: { data: FIRST_RESULT } }, true);

    await findByText("User");

    assert.deepStrictEqual(requestData, [FIRST_WRITE]);
    assert.deepStrictEqual(startedRequests, [FIRST_REQUEST]);
    assert.deepStrictEqual(
      staticData,
      new Array(finishedRenderCount).fill(FIRST_HOOK_RESULT)
    );
  }
);

await testIn("browser").only(
  "`useSuspenseQuery`: data from the transport is used by the hooks",
  async () => {
    let useStaticValueRefStub = <T extends any>(): { current: T } => {
      throw new Error("Should not be called yet!");
    };
    let simulateRequestStart: (options: WatchQueryOptions) => void;
    let simulateRequestData: (options: Cache.WriteOptions) => void;

    const Provider = WrapApolloProvider(
      ({ children, onRequestData, onRequestStarted, ...rest }) => {
        console.log("provider rendering!", {
          children,
          onRequestData,
          onRequestStarted,
          ...rest,
        });
        simulateRequestStart = onRequestStarted!;
        simulateRequestData = onRequestData!;
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

    const client = new WrappedApolloClient({
      cache: new WrappedInMemoryCache(),
    });

    let attemptedRenderCount = 0;
    let finishedRenderCount = 0;

    function Child() {
      attemptedRenderCount++;
      console.log("before");
      const { data } = useSuspenseQuery(QUERY_ME);
      finishedRenderCount++;
      console.log("after");
      return <>{data.me}</>;
    }

    const { findByText, rerender } = render(
      <Provider makeClient={() => client}></Provider>
    );

    simulateRequestStart!(FIRST_REQUEST);
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
    simulateRequestData!(FIRST_WRITE);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log(client.cache.extract());

    // at this point, the suspense hook should return, so why doesn't it?

    await findByText("User");

    assert.ok(attemptedRenderCount > 0);
    assert.ok(finishedRenderCount > 0);
  }
);
