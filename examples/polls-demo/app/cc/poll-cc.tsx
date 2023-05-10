"use client";

import { useSuspenseQuery } from "@apollo/experimental-nextjs-app-support/ssr";
import { useMutation } from "@apollo/client";
import { Poll as PollInner } from "@/components/poll";
import { pollQuery } from "@/components/poll/query";
import { useState, useCallback } from "react";
import { answerPollMutation } from "@/components/poll/mutation";

export const Poll = () => {
  const [showResults, setShowResults] = useState(false);

  const { data } = useSuspenseQuery(pollQuery, {
    variables: { id: "1", delay: 0 },
  });

  const [mutate, { loading: mutationLoading }] =
    useMutation(answerPollMutation);

  const handleClick = useCallback(
    async (answerId: string) => {
      await mutate({
        variables: { pollId: "1", answerId },
      });

      setShowResults(true);
    },
    [mutate]
  );

  return (
    <PollInner
      poll={(data as any).poll}
      loading={mutationLoading}
      onClick={handleClick}
      showResults={showResults}
    />
  );
};
