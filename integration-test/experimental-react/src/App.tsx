import { Suspense } from "react";
import "./App.css";
import {
  WrapApolloProvider,
  WrappedApolloClient,
  WrappedInMemoryCache,
  useSuspenseQuery,
} from "@apollo/client-react-streaming";
import { SchemaLink } from "@apollo/client/link/schema/index.js";
import { ExperimentalReactDataTransport } from "@apollo/client-react-streaming/experimental-react-transport";
import { gql, ApolloLink, Observable } from "@apollo/client/core/index.js";
import { schema } from "./schema";

const delayLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    const handle = setTimeout(() => {
      forward(operation).subscribe(observer);
    }, 1000);

    return () => {
      clearTimeout(handle);
    };
  });
});

const Provider = WrapApolloProvider(ExperimentalReactDataTransport);
const makeClient = () => {
  return new WrappedApolloClient({
    cache: new WrappedInMemoryCache(),
    link:
      // we do not even have a graphql endpoint in the browser, so if this works, streaming works
      typeof window === "undefined"
        ? delayLink.concat(new SchemaLink({ schema }))
        : undefined,
  });
};

function App() {
  return (
    <>
      <h1>Vite + React (patched) Streaming SSR + Apollo Client + Suspense</h1>
      <div className="card">
        <Provider makeClient={makeClient}>
          <Suspense fallback={<div>Loading...</div>}>
            <Countries />
          </Suspense>
        </Provider>
      </div>
    </>
  );
}

const QUERY = gql`
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

export default App;
