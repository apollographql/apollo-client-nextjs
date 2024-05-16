"use client";

import type { TypedDocumentNode } from "@apollo/client";
import { useSuspenseQuery, gql } from "@apollo/client";

const QUERY: TypedDocumentNode<{
  products: {
    id: string;
    title: string;
  }[];
}> = gql`
  query dynamicProducts {
    products {
      id
      title
    }
  }
`;

export const dynamic = "force-dynamic";

export default function Page() {
  const { data } = useSuspenseQuery(QUERY, {
    context: { delay: 1000 },
  });
  globalThis.hydrationFinished?.();

  return (
    <ul>
      {data.products.map(({ id, title }) => (
        <li key={id}>{title}</li>
      ))}
    </ul>
  );
}
