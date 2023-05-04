import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { ApolloServer } from "@apollo/server";
import { gql } from "graphql-tag";
import path from "path";

import DataLoader from "dataloader";
import fs from "fs";
import kv from "@vercel/kv";
import { Resolvers } from "./__generated__/resolvers-types";
const schemaFile = path.resolve(process.cwd(), "app/graphql/schema.graphql");
const typeDefs = gql(fs.readFileSync(schemaFile, "utf8"));

type Answer = {
  id: string;
  text: string;
  votes: number;
};

const batchGetAnswers = async (pollIds: readonly string[]) => {
  const getAnswersForPoll = async (id: string) => {
    const answersKeys = await kv.zrange<string[]>(`poll:${id}:answers`, 0, -1);

    return (
      await Promise.all(
        answersKeys.map(async (answerKey) => {
          const answer = await kv.hgetall(answerKey);
          return answer;
        })
      )
    ).filter((answer): answer is Answer => answer !== null);
  };

  return await Promise.all(pollIds.map(getAnswersForPoll));
};

const answersLoader = new DataLoader<string, Answer[]>(batchGetAnswers);

const batchGetPolls = async (pollIds: readonly string[]) => {
  const getPoll = async (id: string) => {
    return await kv.hget<string>(`poll:${id}`, "question");
  };

  return await Promise.all(pollIds.map(getPoll));
};

const pollLoader = new DataLoader(batchGetPolls);

const resolvers: Resolvers<{
  answersLoader: typeof answersLoader;
  pollLoader: typeof pollLoader;
}> = {
  Query: {
    poll: async (_, { id }, context) => {
      const poll = await context.pollLoader.load(id);

      if (!poll) {
        return null;
      }

      return {
        id,
        question: poll,
      };
    },
  },
  Poll: {
    answers: async (poll, _, context) => {
      const answers = await context.answersLoader.load(poll.id);
      const totalVotes = answers.reduce(
        (total, answer) => total + answer.votes,
        0
      );

      return answers.map((answer) => ({
        ...answer,
        percentage: (answer.votes / totalVotes) * 100,
      }));
    },
  },
  Mutation: {
    answerPoll: async (_, { id: pollId, answerId }, context) => {
      const poll = await context.pollLoader.load(pollId);

      if (!poll) {
        return null;
      }

      await kv.hincrby(`answer:${answerId}`, "votes", 1);

      context.answersLoader.clear(pollId);

      return {
        id: pollId,
        question: poll,
      };
    },
  },
};

const server = new ApolloServer({
  resolvers,
  typeDefs,
});

const handler = startServerAndCreateNextHandler(server, {
  context: async () => {
    return {
      answersLoader,
      pollLoader,
    };
  },
});

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
