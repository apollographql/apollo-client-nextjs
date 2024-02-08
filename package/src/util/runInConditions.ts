import { parseArgs } from "node:util";

type Condition = "react-server" | "node" | "browser" | "default";

/**
 * To be used in test files. This will skip the test if the node runner has not been started matching at least one of the passed conditions.
 * If node has been started with `node --conditions=node --test`, and `runCondition("node", "browser")` is called, the test will run.
 * If node has been started with `node --conditions=react-server --test`, and `runCondition("node", "browser")` is called, the test will not run.
 * @param validConditions
 */
export function runInConditions(...validConditions: Condition[]) {
  console.log(process.execArgv);
  const args = parseArgs({
    args: (process.env.NODE_OPTIONS || "").split(" ").concat(process.execArgv),
    options: {
      conditions: {
        short: "C",
        multiple: true,
        type: "string",
      },
    },
    strict: false,
  });
  console.log(args);
  if (
    !validConditions.some(
      (condition) => args.values.conditions?.includes(condition)
    )
  ) {
    process.exit(0);
  }
}
