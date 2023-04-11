"use client";
import React, { Suspense } from "react";
import { detectEnvironment } from "@apollo/experimental-next";
import {
  useFragment,
  useQuery,
  useSuspenseQuery,
} from "@/../../package/dist/ssr";
import { gql } from "@apollo/client";
import { HtmlChangesObserver } from "@/components/HtmlChangesObserver";

export default function Page() {
  detectEnvironment("Page");

  return (
    <HtmlChangesObserver>
      <Suspense>
        <SuspenseQueryUser>
          <FragmentUser />
          <QueryUser />
        </SuspenseQueryUser>
        <FragmentUser />
      </Suspense>
    </HtmlChangesObserver>
  );
}

function Result({ source, data }: { source: string; data: unknown }) {
  return (
    <div>
      <span>{source}</span>
      <span>{JSON.stringify(data)}</span>
    </div>
  );
}

const userFragment = gql`
  fragment UserFragment on User {
    id
    name
  }
`;

const userQuery = gql`
  query {
    getUser(id: "1") {
      ...UserFragment
    }
  }
  ${userFragment}
`;

function SuspenseQueryUser({ children }: React.PropsWithChildren) {
  const result = useSuspenseQuery(userQuery);
  return (
    <>
      <Result source="useSuspenseQuery(userQuery)" data={result.data} />
      {children}
    </>
  );
}

function FragmentUser({ children }: React.PropsWithChildren) {
  const result = useFragment({
    fragment: userFragment,
    from: { __typename: "User", id: "1" },
  });
  return (
    <>
      <Result source="useFragment(userQuery)" data={result.data} />
      {children}
    </>
  );
}

function QueryUser({ children }: React.PropsWithChildren) {
  const result = useQuery(userQuery);
  return (
    <>
      <Result source="useQuery(userQuery)" data={result.data} />
      {children}
    </>
  );
}
