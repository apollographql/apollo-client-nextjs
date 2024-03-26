import { headers } from "next/headers";
import { ApolloWrapper } from "../ApolloWrapper";
import { cloakSSROnlySecret } from "ssr-only-secrets";

export default async function Layout({ children }: React.PropsWithChildren) {
  // force this into definitely rendering on the server, and dynamically
  console.log(headers().toString().substring(0, 0));
  const nonce = headers().get("x-nonce-param") ?? undefined;
  return (
    <ApolloWrapper
      nonce={nonce ? await cloakSSROnlySecret(nonce, "SECRET") : undefined}
    >
      {children}
    </ApolloWrapper>
  );
}
