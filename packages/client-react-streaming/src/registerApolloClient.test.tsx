import { it } from "node:test";
import assert from "node:assert";
import { runInConditions } from "./util/runInConditions.js";
import { Writable } from "node:stream";

runInConditions("react-server");

const { registerApolloClient, ApolloClient, InMemoryCache } = await import(
  "#bundled"
);

type ReactServer = {
  renderToPipeableStream(
    model: React.ReactNode,
    webpackMap: unknown,
    options?: {
      environmentName?: string;
      onError?: (error: any) => void;
      onPostpone?: (reason: string) => void;
      identifierPrefix?: string;
    }
  ): {
    abort(reason: any): void;
    pipe<T extends Writable>(destination: T): T;
  };
};

const { renderToPipeableStream } = (await import(
  // @ts-expect-error close enough
  "react-server-dom-webpack/server"
)) as ReactServer;
const React = await import("react");

function drain(stream: ReturnType<typeof renderToPipeableStream>) {
  let result = "";
  return new Promise<string>((resolve) => {
    stream.pipe(
      new Writable({
        write(chunk, _encoding, callback) {
          result += chunk.toString();
          callback();
        },
        final(callback) {
          resolve(result);
          callback();
        },
      })
    );
  });
}

function makeClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    connectToDevTools: false,
  });
}

it("calling `getClient` outside of a React render creates a new instance every time", () => {
  const { getClient } = registerApolloClient(makeClient);

  const client1 = getClient();
  const client2 = getClient();
  assert.notStrictEqual(client1, client2);
});

it("calling `getClient` twice during the same React render will return the same instance", async () => {
  const { getClient } = registerApolloClient(makeClient);

  const clients: any[] = [];
  function App() {
    clients.push(getClient());
    clients.push(getClient());
    return <div></div>;
  }

  const stream = renderToPipeableStream(React.createElement(App), {});
  await drain(stream);

  assert.equal(clients.length, 2);
  assert.ok(clients[0] instanceof ApolloClient);
  assert.strictEqual(clients[0], clients[1]);
});

it("calling `getClient` twice during different React renders will return different instances", async () => {
  const { getClient } = registerApolloClient(makeClient);

  const clients: any[] = [];
  function App() {
    clients.push(getClient());
    return <div></div>;
  }

  {
    const stream = renderToPipeableStream(React.createElement(App), {});
    await drain(stream);
  }
  {
    const stream = renderToPipeableStream(React.createElement(App), {});
    await drain(stream);
  }

  assert.equal(clients.length, 2);
  assert.ok(clients[0] instanceof ApolloClient);
  assert.notStrictEqual(clients[0], clients[1]);
});
