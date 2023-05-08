"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Poll as PollInner } from "@/components/poll";
import { answerPollMutation } from "@/components/poll/mutation";
import { useMutation } from "@apollo/client";

export const Poll = ({
  poll,
}: {
  poll: {
    id: string;
    question: string;
    totalVotes: number;
    answers: {
      id: string;
      votes: number;
      percentage: number;
      text: string;
    }[];
  };
}) => {
  const router = useRouter();

  const [mutate, { loading }] = useMutation(answerPollMutation);

  const handleClick = useCallback(
    async (answerId: string) => {
      await mutate({
        variables: { pollId: poll.id, answerId },
      });

      // refresh so the page is updated with the new data
      router.refresh();
    },
    [mutate, poll.id, router]
  );

  return <PollInner poll={poll} loading={loading} onClick={handleClick} />;
};
