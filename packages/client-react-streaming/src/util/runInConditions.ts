import { parseArgs } from "node:util";
import { test } from "node:test";
type Condition = "react-server" | "node" | "browser" | "default";

/**
 * To be used in test files. This will skip the test if the node runner has not been started matching at least one of the passed conditions.
 * If node has been started with `node --conditions=node --test`, and `runCondition("node", "browser")` is called, the test will run.
 * If node has been started with `node --conditions=react-server --test`, and `runCondition("node", "browser")` is called, the test will not run.
 * @param validConditions
 */
export function runInConditions(...validConditions: Condition[]) {
  if (!conditionActive(validConditions)) {
    process.exit(0);
  }
}

export function testIn(...validConditions: Condition[]) {
  if (conditionActive(validConditions)) {
    return test;
  }
  return new Proxy(test, {
    apply() {},
    get() {
      return function () {};
    },
  });
}

function conditionActive(validConditions: Condition[]) {
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

  const activeConditions = args.values.conditions || [];

  return validConditions.some((condition) =>
    activeConditions.includes(condition)
  );
}
