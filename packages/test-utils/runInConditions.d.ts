/**
 * @typedef {"react-server" | "node" | "browser" | "default"} Condition
 */
/**
 * To be used in test files. This will skip the test if the node runner has not been started matching at least one of the passed conditions.
 * If node has been started with `node --conditions=node --test`, and `runCondition("node", "browser")` is called, the test will run.
 * If node has been started with `node --conditions=react-server --test`, and `runCondition("node", "browser")` is called, the test will not run.
 * @param  {Condition[]} validConditions
 */
export function runInConditions(...validConditions: Condition[]): void;
/**
 * @param  {Condition[]} validConditions
 */
export function outsideOf(...validConditions: Condition[]): boolean;
export type Condition = "react-server" | "node" | "browser" | "default";
