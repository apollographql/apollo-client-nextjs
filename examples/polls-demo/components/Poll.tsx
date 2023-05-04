"use client";

import { useState } from "react";
import { Answer } from "./Answer";
import gql from "graphql-tag";
import { useMutation } from "@apollo/client";
import { useQuery } from "@apollo/experimental-nextjs-app-support/ssr";

const mutation = gql`
  mutation ($pollId: ID!, $answerId: ID!) {
    answerPoll(id: $pollId, answerId: $answerId) {
      question
      answers {
        id
        text
        votes
        percentage
      }
    }
  }
`;

export const PollInner = ({
  poll,
}: {
  poll: {
    id: string;
    question: string;
    answers: {
      id: string;
      votes: number;
      percentage: number;
      text: string;
    }[];
  };
}) => {
  const [showResults, setShowResults] = useState(false);

  const [mutate, { loading }] = useMutation(mutation);

  const handleClick = async (answerId: string) => {
    await mutate({ variables: { pollId: poll.id, answerId } });
    setShowResults(true);
  };

  return (
    <div>
      <h1 className="text-6xl mb-6">{poll.question}</h1>

      <ul className="max-w-3xl">
        {poll.answers.map((answer) => (
          <Answer
            key={answer.id}
            text={answer.text}
            percentage={answer.percentage}
            showPercentage={showResults}
            disabled={showResults}
            loading={loading}
            votes={answer.votes}
            onClick={() => handleClick(answer.id)}
          />
        ))}
      </ul>
    </div>
  );
};

const pollQuery = gql`
  query ($id: ID!) {
    poll(id: $id) {
      id
      question
      answers {
        id
        text
        votes
        percentage
      }
    }
  }
`;

export const Poll = ({ id }: { id: string }) => {
  const { data, loading, error } = useQuery(pollQuery, { variables: { id } });

  if (loading) {
    return <p>Loading...</p>;
  } else if (error) {
    return <p>Error: {error.message}</p>;
  } else if (!data) {
    return <p>No data</p>;
  }

  return <PollInner poll={data.poll} />;
};
