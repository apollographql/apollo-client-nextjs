import * as Types from "../types.generated";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type AnswerPollMutationVariables = Types.Exact<{
  pollId: Types.Scalars["ID"];
  answerId: Types.Scalars["ID"];
}>;

export type AnswerPollMutation = {
  __typename?: "Mutation";
  answerPoll?: {
    __typename?: "Poll";
    id: string;
    question: string;
    totalVotes: number;
    answers: Array<{
      __typename?: "Answer";
      id: string;
      text: string;
      votes: number;
      percentage: number;
    }>;
  } | null;
};

export type GetPollQueryVariables = Types.Exact<{
  id: Types.Scalars["ID"];
  delay?: Types.InputMaybe<Types.Scalars["Int"]>;
}>;

export type GetPollQuery = {
  __typename?: "Query";
  poll?: {
    __typename?: "Poll";
    id: string;
    question: string;
    totalVotes: number;
    answers: Array<{
      __typename?: "Answer";
      id: string;
      text: string;
      votes: number;
      percentage: number;
    }>;
  } | null;
};

export const AnswerPollDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "AnswerPoll" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "pollId" },
          },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "ID" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "answerId" },
          },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "ID" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "answerPoll" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "id" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "pollId" },
                },
              },
              {
                kind: "Argument",
                name: { kind: "Name", value: "answerId" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "answerId" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "question" } },
                { kind: "Field", name: { kind: "Name", value: "totalVotes" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "answers" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "text" } },
                      { kind: "Field", name: { kind: "Name", value: "votes" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "percentage" },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AnswerPollMutation, AnswerPollMutationVariables>;
export const GetPollDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "GetPoll" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "id" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "ID" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "delay" },
          },
          type: { kind: "NamedType", name: { kind: "Name", value: "Int" } },
          defaultValue: { kind: "IntValue", value: "0" },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "poll" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "id" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "id" },
                },
              },
            ],
            directives: [
              {
                kind: "Directive",
                name: { kind: "Name", value: "delay" },
                arguments: [
                  {
                    kind: "Argument",
                    name: { kind: "Name", value: "ms" },
                    value: {
                      kind: "Variable",
                      name: { kind: "Name", value: "delay" },
                    },
                  },
                ],
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "question" } },
                { kind: "Field", name: { kind: "Name", value: "totalVotes" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "answers" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "text" } },
                      { kind: "Field", name: { kind: "Name", value: "votes" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "percentage" },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetPollQuery, GetPollQueryVariables>;
