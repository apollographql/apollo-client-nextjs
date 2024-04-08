import test, { describe } from "node:test";
import { revive, stringify } from "./serialization.js";
import { outsideOf } from "../util/runInConditions.js";
import { htmlEscapeJsonString } from "./htmlescape.js";
import assert from "node:assert";

describe(
  "serialization and deserialization of data",
  // we do not test the bundle, so we really just need to run this test in one environment
  { skip: outsideOf("node") },
  () => {
    for (const [data, serialized] of [
      [{ a: 1, b: 2, c: 3 }, '{"undefined":"$u","value":{"a":1,"b":2,"c":3}}'],
      [
        { a: "$u", b: 2, c: 3 },
        '{"undefined":"$$u","value":{"a":"$u","b":2,"c":3}}',
      ],
      [
        { a: "a$u", b: undefined, c: 3 },
        '{"undefined":"$u","value":{"a":"a$u","b":"$u","c":3}}',
      ],
      [
        { a: "$u", b: 2, c: undefined },
        '{"undefined":"$$u","value":{"a":"$u","b":2,"c":"$$u"}}',
      ],
      [
        { a: undefined, b: 2, c: 3 },
        '{"undefined":"$u","value":{"a":"$u","b":2,"c":3}}',
      ],
    ]) {
      test(JSON.stringify(data), () => {
        const stringified = stringify(data);
        const result = revive(eval(`(${htmlEscapeJsonString(stringified)})`));
        assert.equal(stringified, serialized);
        assert.deepStrictEqual(data, result);
      });
    }
  }
);
