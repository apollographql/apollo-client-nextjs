import { runInConditions, testIn } from "../util/runInConditions.js";

runInConditions("browser", "node");

const { WrappedApolloClient, WrappedInMemoryCache } = await import(
  "@apollo/experimental-nextjs-app-support"
);

console.log({ WrappedApolloClient, WrappedInMemoryCache });

testIn("node").only("Test", () => {
  console.log({ WrappedApolloClient, WrappedInMemoryCache });
});
