import { ApolloWrapper } from "@/app/cc/ApolloWrapper";
import { PreloadQuery } from "@apollo/client-react-streaming";
import { ClientChild } from "./ClientChild";
import { QUERY } from "../shared";

export const dynamic = "force-dynamic";
import { getClient } from "../../../client";
import { Suspense } from "react";

export default function Page({ searchParams }: { searchParams?: any }) {
  return (
    <ApolloWrapper>
      <PreloadQuery
        options={{
          query: QUERY,
          context: {
            delay: 1000,
            error: searchParams?.errorIn || undefined,
          },
        }}
        getClient={getClient}
      >
        {(queryRef) => (
          <Suspense fallback={<>loading</>}>
            <ClientChild queryRef={queryRef as any /*TODO*/} />
          </Suspense>
        )}
      </PreloadQuery>
    </ApolloWrapper>
  );
}
