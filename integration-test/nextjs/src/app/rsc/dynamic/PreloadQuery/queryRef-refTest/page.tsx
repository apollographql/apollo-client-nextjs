import { QUERY } from "../shared";
import { Suspense } from "react";
import { getClient } from "@/app/rsc/client";
import { PreloadQuery } from "@apollo/client-react-streaming";
import { RefTestChild } from "./RefTestChild";
import { ApolloWrapper } from "@/app/cc/ApolloWrapper";

import "./styles.css";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ApolloWrapper>
      <form name="test">
        <PreloadQuery
          options={{
            query: QUERY,
            context: {
              delay: 100,
            },
            variables: {
              someArgument: "query1",
            },
          }}
          getClient={getClient}
        >
          {(queryRef1) => (
            <>
              <RefTestChild queryRef={queryRef1} set="1" />
              <RefTestChild queryRef={queryRef1} set="1" />
            </>
          )}
        </PreloadQuery>
        <PreloadQuery
          options={{
            query: QUERY,
            context: {
              delay: 100,
            },
            variables: {
              someArgument: "query2",
            },
          }}
          getClient={getClient}
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
