import test, { describe } from "node:test";
import { revive, stringify } from "./serialization.js";
import { outsideOf } from "@internal/test-utils/runInConditions.js";
import { htmlEscapeJsonString } from "./htmlescape.js";
import assert from "node:assert";

describe(
  "serialization and deserialization of data",
  // we do not test the bundle, so we really just need to run this test in one environment
  { skip: outsideOf("node") },
  () => {
    for (const [data, serialized] of [
      [{ a: 1, b: 2, c: 3 }, '{"a":1,"b":2,"c":3}'],
      [
        { a: "$apollo.undefined$", b: 2, c: undefined },
        '{"a":"$apollo.undefined$","b":2,"c":undefined}',
      ],
      [
        { a: "a$apollo.undefined$", b: undefined, c: 3 },
        '{"a":"a$apollo.undefined$","b":undefined,"c":3}',
      ],
      [
        {
          a: "$$apollo.undefined$",
          b: 2,
          c: undefined,
          d: "$apollo.undefined$",
        },
        '{"a":"$$apollo.undefined$","b":2,"c":undefined,"d":"$apollo.undefined$"}',
      ],
      [{ a: undefined, b: 2, c: 3 }, '{"a":undefined,"b":2,"c":3}'],
    ] as const) {
      test(JSON.stringify(data), () => {
        const stringified = stringify(data);
        const result = revive(eval(`(${htmlEscapeJsonString(stringified)})`));
        assert.equal(stringified, serialized);
        assert.deepStrictEqual(data, result);
      });
    }
  }
);
