import { ApolloWrapper } from "./apollo-wrapper";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ApolloWrapper>{children}</ApolloWrapper>;
}
