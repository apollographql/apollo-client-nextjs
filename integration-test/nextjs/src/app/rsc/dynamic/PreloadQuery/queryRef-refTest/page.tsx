import { QUERY } from "../shared";
import { Suspense } from "react";
import { PreloadQuery } from "@/app/rsc/client";
import { RefTestChild } from "./RefTestChild";
import { ApolloWrapper } from "@/app/cc/ApolloWrapper";

import "./styles.css";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ApolloWrapper>
      <form name="test">
        <PreloadQuery
          query={QUERY}
          context={{
            delay: 100,
          }}
          variables={{
            someArgument: "query1",
          }}
        >
          {(queryRef1) => (
            <>
              <RefTestChild queryRef={queryRef1} set="1" />
              <RefTestChild queryRef={queryRef1} set="1" />
            </>
          )}
        </PreloadQuery>
        <PreloadQuery
          query={QUERY}
          context={{
            delay: 100,
          }}
          variables={{
            someArgument: "query2",
          }}
        >
          {(queryRef2) => (
            <Suspense fallback={<>loading</>}>
              <RefTestChild queryRef={queryRef2} set="2" />
              <RefTestChild queryRef={queryRef2} set="2" />
            </Suspense>
          )}
        </PreloadQuery>
      </form>
    </ApolloWrapper>
  );
}
