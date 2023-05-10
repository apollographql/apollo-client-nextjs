import gql from "graphql-tag";

export const pollQuery = gql`
  query ($id: ID!, $delay: Int = 0) {
    poll(id: $id) @delay(ms: $delay) {
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
