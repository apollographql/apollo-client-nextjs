import { WrapApolloProvider } from "@apollo/client-react-streaming";
import { ExperimentalReactDataTransport } from "@apollo/client-react-streaming/experimental-react-transport";

export const WrappedApolloProvider = WrapApolloProvider(
  ExperimentalReactDataTransport
);
