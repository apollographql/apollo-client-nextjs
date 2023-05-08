import gql from "graphql-tag";

export const pollQuery = gql`
  query ($id: ID!) {
    poll(id: $id) {
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
