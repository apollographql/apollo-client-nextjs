import React, { Suspense, use, useMemo } from "react";
import { runInConditions, testIn } from "../util/runInConditions.js";
import type {
  TypedDocumentNode,
  WatchQueryOptions,
} from "@apollo/client/index.js";
import { gql } from "@apollo/client/index.js";

import "global-jsdom/register";
import assert from "node:assert";
import { afterEach } from "node:test";
import { getQueriesForElement } from "@testing-library/react";
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
    // will try with server value and immediately restart with client value
    // one rerender with the actual client value (which is hopefull equal)
    assert.equal(finishedRenderCount, 1);

    assert.deepStrictEqual(JSON.parse(JSON.stringify(client.extract())), {
      ROOT_QUERY: {
        __typename: "Query",
        me: "User",
      },
    });
  }
);

const { hydrateRoot } = await import("react-dom/client");

// prettier-ignore
// @ts-ignore
function $RS(a, b) { a = document.getElementById(a); b = document.getElementById(b); for (a.parentNode.removeChild(a); a.firstChild;)b.parentNode.insertBefore(a.firstChild, b); b.parentNode.removeChild(b) }
// prettier-ignore
// @ts-ignore
function $RC(b, c, e = undefined) { c = document.getElementById(c); c.parentNode.removeChild(c); var a = document.getElementById(b); if (a) { b = a.previousSibling; if (e) b.data = "$!", a.setAttribute("data-dgst", e); else { e = b.parentNode; a = b.nextSibling; var f = 0; do { if (a && 8 === a.nodeType) { var d = a.data; if ("/$" === d) if (0 === f) break; else f--; else "$" !== d && "$?" !== d && "$!" !== d || f++ } d = a.nextSibling; e.removeChild(a); a = d } while (a); for (; c.firstChild;)e.insertBefore(c.firstChild, a); b.data = "$" } b._reactRetry && b._reactRetry() } }

function appendToBody(html: TemplateStringsArray) {
  document.body.insertAdjacentHTML("beforeend", html[0].trim());
}

await testIn("browser")(
  "race condition: client ahead of server renders without hydration mismatch",
  async () => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
    let useStaticValueRefStub = <T extends unknown>(): { current: T } => {
      throw new Error("Should not be called yet!");
    };

    const client = new WrappedApolloClient({
      connectToDevTools: false,
      cache: new WrappedInMemoryCache(),
    });
    const simulateRequestStart = client.onRequestStarted;
    const simulateRequestData = client.onRequestData;

    const Provider = WrapApolloProvider(
      ({ children, onRequestData, onRequestStarted, ..._rest }) => {
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

    let finishedRenders: any[] = [];

    function Child() {
      const { data } = useSuspenseQuery(QUERY_ME);
      finishedRenders.push(data);
      return <div id="user">{data.me}</div>;
    }

    const promise = Promise.resolve();
    // suspends on the server, immediately resolved in browser
    function ParallelSuspending() {
      use(promise);
      return <div id="parallel">suspending in parallel</div>;
    }

    const { findByText } = getQueriesForElement(document.body);

    // server starts streaming
    document.body.innerHTML =
      '<!--$?--><template id="B:0"></template>Fallback<!--/$-->';
    // request started on the server
    simulateRequestStart!(FIRST_REQUEST);

    hydrateRoot(
      document.body,
      <Provider makeClient={() => client}>
        <Suspense fallback={"Fallback"}>
          <Child />
          <ParallelSuspending />
        </Suspense>
      </Provider>
    );

    await findByText("Fallback");
    // this is the div for the suspense boundary
    appendToBody`<div hidden id="S:0"><template id="P:1"></template><template id="P:2"></template></div>`;
    // request has finished on the server
    simulateRequestData!(FIRST_WRITE);
    // `Child` component wants to transport data from SSR render to the browser
    useStaticValueRefStub = () => ({ current: FIRST_HOOK_RESULT as any });
    // `Child` finishes rendering on the server
    appendToBody`<div hidden id="S:1"><div id="user">User</div></div>`;
    $RS("S:1", "P:1");

    // meanwhile, in the browser, the cache is modified
    client.cache.writeQuery({
      query: QUERY_ME,
      data: {
        me: "Future me.",
      },
    });

    // `ParallelSuspending` finishes rendering
    appendToBody`<div hidden id="S:2"><div id="parallel">suspending in parallel</div></div>`;
    $RS("S:2", "P:2");

    // everything in the suspende boundary finished rendering, so assemble HTML and take up React rendering again
    $RC("B:0", "S:0");

    // we expect the *new* value to appear after hydration finished, not the old value from the server
    await findByText("Future me.");

    // one render to rehydrate the server value
    // one rerender with the actual client value (which is hopefull equal)
    assert.deepStrictEqual(finishedRenders, [
      { me: "User" },
      { me: "Future me." },
    ]);

    assert.deepStrictEqual(JSON.parse(JSON.stringify(client.extract())), {
      ROOT_QUERY: {
        __typename: "Query",
        me: "Future me.",
      },
    });
    assert.equal(
      document.body.innerHTML,
      `<!--$--><div id="user">Future me.</div><div id="parallel">suspending in parallel</div><!--/$-->`
    );
  }
);
