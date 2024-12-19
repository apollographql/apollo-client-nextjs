import { ApolloWrapper } from "@/app/cc/ApolloWrapper";
import { ClientChild } from "./ClientChild";
import { QUERY } from "@integration-test/shared/queries";

export const dynamic = "force-dynamic";
import { PreloadQuery } from "../../../client";
import { Suspense } from "react";

export default async function Page({ searchParams }: { searchParams?: any }) {
  return (
    <ApolloWrapper>
      <PreloadQuery
        query={QUERY}
        context={{
          delay: 1000,
          error: (await searchParams)?.errorIn || undefined,
        }}
      >
        <Suspense fallback={<>loading</>}>
          <ClientChild />
        </Suspense>
      </PreloadQuery>
    </ApolloWrapper>
  );
}
