import { pollQuery } from "@/components/poll/query";
import { getClient } from "./client";
import { Poll } from "./poll-rsc";
import { ApolloWrapper } from "../ssr/apollo-wrapper";

export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await getClient().query({
    query: pollQuery,
    variables: { id: "1" },
  });

  // we are using Apollo Wrapper here too so we can use
  // useMutation in the Poll component
  return (
    <ApolloWrapper>
      <Poll poll={data.data.poll} />
    </ApolloWrapper>
  );
}
