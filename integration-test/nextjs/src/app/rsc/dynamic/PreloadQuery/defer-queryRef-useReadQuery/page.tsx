import { ApolloWrapper } from "@/app/cc/ApolloWrapper";
import { ClientChild } from "./ClientChild";
import { DEFERRED_QUERY_WITH_FRAGMENT } from "@integration-test/shared/queries";

export const dynamic = "force-dynamic";
import { PreloadQuery } from "../../../client";
import { Suspense } from "react";

export default async function Page({ searchParams }: { searchParams?: any }) {
  return (
    <ApolloWrapper>
      <PreloadQuery
        query={DEFERRED_QUERY_WITH_FRAGMENT}
        context={{
          delay: 1000,
          error: (await searchParams)?.errorIn || undefined,
        }}
        variables={{ delayDeferred: 1000 }}
      >
        {(queryRef) => (
          <Suspense fallback={<>loading</>}>
            <ClientChild queryRef={queryRef} />
          </Suspense>
        )}
      </PreloadQuery>
    </ApolloWrapper>
  );
}
