import { createFileRoute } from "@tanstack/react-router";
import { QUERY } from "@integration-test/shared/queries";
import { useSuspenseQuery } from "@apollo/client";
import { useTransition } from "react";

export const Route = createFileRoute("/useSuspenseQuery")({
  component: RouteComponent,
});

function RouteComponent() {
  const [refetching, startTransition] = useTransition();
  const { data, refetch } = useSuspenseQuery(QUERY);

  return (
    <>
      <ul>
        {data.products.map(({ id, title }) => (
          <li key={id}>{title}</li>
        ))}
      </ul>
      <p>Queried in {data.env} environment</p>
      <button
        disabled={refetching}
        onClick={() => {
          startTransition(() => {
            refetch();
          });
        }}
      >
        {refetching ? "refetching..." : "refetch"}
      </button>
    </>
  );
}
