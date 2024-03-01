import { Suspense, useState } from "react";
import {
  ApolloNextAppProvider,
  NextSSRApolloClient,
  NextSSRInMemoryCache,
  useSuspenseQuery,
} from "@apollo/experimental-nextjs-app-support/ssr";
import { SchemaLink } from "@apollo/client/link/schema/index.js";
import { gql, ApolloLink, Observable } from "@apollo/client/index.js";
import { schema } from "./schema";

const delayLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    const handle = setTimeout(() => {
      forward(operation).subscribe(observer);
    }, 20);

    return () => {
      clearTimeout(handle);
    };
  });
});

export const makeClient = () => {
  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link: delayLink.concat(new SchemaLink({ schema })),
  });
};

function App() {
  return (
    <>
      <h1>Vite + React (patched) Streaming SSR + Apollo Client + Suspense</h1>
      <div className="card">
        <ApolloNextAppProvider makeClient={makeClient}>
          <Suspense fallback={<div>Loading...</div>}>
            <Countries />
            <Counter />
          </Suspense>
        </ApolloNextAppProvider>
      </div>
    </>
  );
}

export const QUERY = gql`
  query {
    products {
      id
      title
    }
  }
`;

function Countries() {
  const { data } = useSuspenseQuery(QUERY);

  return (
    <ul>
      {data.products.map((product) => (
        <li key={product.id}>{product.title}</li>
      ))}
    </ul>
  );
}

/**
 * Counter components to test that the client has hydrated and is interactive.
 */
function Counter() {
  const [counter, setCounter] = useState(0);
  return (
    <>
      <div data-testid="counter">{counter}</div>
      <button onClick={() => setCounter((x) => x + 1)}>increment</button>
    </>
  );
}

export default App;
