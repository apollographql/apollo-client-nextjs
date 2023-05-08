import gql from "graphql-tag";

export const answerPollMutation = gql`
  mutation ($pollId: ID!, $answerId: ID!) {
    answerPoll(id: $pollId, answerId: $answerId) {
      id
      question
      totalVotes
      answers {
        id
        text
        votes
        percentage
      }
    }
  }
`;
