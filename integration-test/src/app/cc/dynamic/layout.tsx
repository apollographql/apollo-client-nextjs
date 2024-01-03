import { headers } from "next/headers";
import { ApolloWrapper } from "../ApolloWrapper";

export default function Layout({ children }: React.PropsWithChildren) {
  // force this into definitely rendering on the server, and dynamically
  console.log(headers().toString().substring(0, 0));
  const nonce = headers().get("x-nonce-param") ?? undefined;
  return <ApolloWrapper nonce={nonce}>{children}</ApolloWrapper>;
}
