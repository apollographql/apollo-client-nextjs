"use client";

import { useSuspenseQuery } from "@apollo/experimental-nextjs-app-support/ssr";
import { useMutation } from "@apollo/client";
import { Poll as PollInner } from "@/components/poll";
import { pollQuery } from "@/components/poll/query";
import { useCallback } from "react";
import { answerPollMutation } from "@/components/poll/mutation";

export const Poll = () => {
  const { data } = useSuspenseQuery(pollQuery, {
    variables: { id: "1" },
  });

  const [mutate, { loading: mutationLoading }] =
    useMutation(answerPollMutation);

  const handleClick = useCallback(
    async (answerId: string) => {
      await mutate({
        variables: { pollId: "1", answerId },
      });
    },
    [mutate]
  );

  return (
    <PollInner
      poll={data.poll}
      loading={mutationLoading}
      onClick={handleClick}
    />
  );
};
