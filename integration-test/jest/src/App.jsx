import { Suspense, useState } from "react";
import {
  ApolloNextAppProvider,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import { SchemaLink } from "@apollo/client/link/schema/index.js";
import { gql, ApolloLink, Observable } from "@apollo/client/index.js";
import { useSuspenseQuery } from "@apollo/client/react/index.js";
import { schema } from "./schema";

const delayLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    const handle = setTimeout(() => {
      forward(operation).subscribe(observer);
    }, 100);

    return () => {
      clearTimeout(handle);
    };
  });
});

export const makeClient = () => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: delayLink.concat(new SchemaLink({ schema })),
  });
};

function App() {
  return (
    <>
      <h1>Jest integration test</h1>
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
