"use client";

import { useState } from "react";
import { Answer } from "../answer";

export const Poll = ({
  poll,
  loading = false,
  onClick,
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
  loading?: boolean;
  onClick: (answerId: string) => Promise<void>;
}) => {
  const [showResults, setShowResults] = useState(false);

  const handleClick = async (answerId: string) => {
    await onClick(answerId);
    setShowResults(true);
  };

  return (
    <div>
      <h1 className="text-6xl mb-6">{poll.question}</h1>
      <p className="text-2xl mb-6">
        Total votes: {poll.totalVotes.toLocaleString()}
      </p>

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

export const PollSkeleton = () => {
  return (
    <div>
      <h1 className="text-6xl mb-6">
        🚀
        <br />
        Loading...
      </h1>
      <p className="text-2xl mb-6">Total votes: 0</p>

      <ul className="max-w-3xl">
        <Answer text="Loading..." loading />
        <Answer text="Loading..." loading />
        <Answer text="Loading..." loading />
        <Answer text="Loading..." loading />
      </ul>
    </div>
  );
};
