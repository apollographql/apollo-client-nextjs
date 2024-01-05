export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  _Any: any;
};

export type Answer = {
  __typename?: "Answer";
  id: Scalars["ID"];
  percentage: Scalars["Float"];
  text: Scalars["String"];
  votes: Scalars["Int"];
};

export type Mutation = {
  __typename?: "Mutation";
  answerPoll?: Maybe<Poll>;
};

export type MutationAnswerPollArgs = {
  answerId: Scalars["ID"];
  id: Scalars["ID"];
};

export type Poll = {
  __typename?: "Poll";
  answers: Array<Answer>;
  id: Scalars["ID"];
  question: Scalars["String"];
  totalVotes: Scalars["Int"];
};

export type Query = {
  __typename?: "Query";
  _service: _Service;
  poll?: Maybe<Poll>;
};

export type QueryPollArgs = {
  id: Scalars["ID"];
};

export type _Service = {
  __typename?: "_Service";
  sdl: Scalars["String"];
};
