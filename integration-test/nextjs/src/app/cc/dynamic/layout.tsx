import { headers } from "next/headers";
import { ApolloWrapper } from "../ApolloWrapper";
import { cloakSSROnlySecret } from "ssr-only-secrets";

export default async function Layout({ children }: React.PropsWithChildren) {
  const nonce = (await headers()).get("x-nonce-param") ?? undefined;
  return (
    <ApolloWrapper
      nonce={nonce ? await cloakSSROnlySecret(nonce, "SECRET") : undefined}
    >
      {children}
    </ApolloWrapper>
  );
}
