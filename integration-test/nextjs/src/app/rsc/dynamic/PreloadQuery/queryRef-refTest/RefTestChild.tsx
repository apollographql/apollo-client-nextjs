"use client";

import { QueryReference, useQueryRefHandlers } from "@apollo/client";
import { DynamicProductResult } from "../shared";
import { useEffect, useState } from "react";
import {
  InternalQueryReference,
  QueryReferenceBase,
  unwrapQueryRef,
} from "@apollo/client/react/internal";

declare global {
  interface Window {
    testRefs?: {
      distinctObjectReferences: Set<unknown>;
      uniqueQueryRefs1: Set<InternalQueryReference<DynamicProductResult>>;
      uniqueQueryRefs2: Set<InternalQueryReference<DynamicProductResult>>;
      distinctQueryRefs: Set<InternalQueryReference<DynamicProductResult>>;
    };
  }
}
export function RefTestChild({
  queryRef,
  set,
}: {
  queryRef: QueryReferenceBase<DynamicProductResult>;
  set: "1" | "2";
}) {
  const [isClient, setIsClient] = useState(false);

  useQueryRefHandlers(queryRef);

  useEffect(() => {
    const realQueryRef = queryRef as any as {
      __transportedQueryRef: QueryReference<DynamicProductResult>;
    };
    if (!window.testRefs) {
      window.testRefs = {
        distinctObjectReferences: new Set(), // expected: [transportedQueryRef1_1, transportedQueryRef1_2, transportedQueryRef2_1, transportedQueryRef2_2]
        distinctQueryRefs: new Set(), // expected: [innerQueryRef1, innerQueryRef2]
        uniqueQueryRefs1: new Set(), // expected: [innerQueryRef1]
        uniqueQueryRefs2: new Set(), // expected: [innerQueryRef2]
      };
    }
    window.testRefs[`uniqueQueryRefs${set}`].add(
      unwrapQueryRef(realQueryRef.__transportedQueryRef)
    );
    window.testRefs.distinctQueryRefs.add(
      unwrapQueryRef(realQueryRef.__transportedQueryRef)
    );
    window.testRefs.distinctObjectReferences.add(queryRef);
    setIsClient(true);
  }, []);

  return isClient && window.testRefs ? (
    <>
      <div>
        <label>
          uniqueQueryRefs{set}
          <input
            type="number"
            className={
              window.testRefs[`uniqueQueryRefs${set}`].size > 1
                ? "invalid"
                : "valid"
            }
            value={window.testRefs[`uniqueQueryRefs${set}`].size}
            onChange={() => {}}
          />
        </label>
      </div>
      <div>
        <label>
          distinctQueryRefs
          <input
            type="number"
            className={
              window.testRefs.distinctQueryRefs.size > 2 ? "invalid" : "valid"
            }
            value={window.testRefs.distinctQueryRefs.size}
            onChange={() => {}}
          />
        </label>
      </div>
      <div>
        <label>
          distinctObjectReferences
          <input
            type="number"
            className={
              window.testRefs.distinctObjectReferences.size > 4
                ? "invalid"
                : "valid"
            }
            value={window.testRefs.distinctObjectReferences.size}
            onChange={() => {}}
          />
        </label>
      </div>
    </>
  ) : null;
}
