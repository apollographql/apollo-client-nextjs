"use server";
import { cookies } from "next/headers";
import { ClientLayout } from "./ClientLayout";

import { ApolloWrapper } from "./ApolloWrapper";
/*
export const metadata = {
  title: "Hack the Supergraph",
  description:
    'Based on the "Hack the Supergraph" app found on https://github.com/apollographql/hack-the-supergraph',
};
*/

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const delay = Number(cookieStore.get("apollo-x-custom-delay")?.value ?? 1000);

  return (
    <html lang="en">
      <body>
        <ApolloWrapper delay={delay}>
          <ClientLayout>{children}</ClientLayout>
        </ApolloWrapper>
      </body>
    </html>
  );
}
