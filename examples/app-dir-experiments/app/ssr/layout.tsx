import { ApolloWrapper } from "./ApolloWrapper";
export default function Layout({ children }: React.PropsWithChildren) {
  return <ApolloWrapper>{children}</ApolloWrapper>;
}
