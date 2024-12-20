import { ActionFunctionArgs } from "react-router";
import { experimentalExecuteIncrementally, parse } from "graphql";
import { schema } from "@integration-test/shared/schema";

/**
 * `@defer`-capable very crude implementation of a GraphQL server.
 */

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json();
  const { query, variables } = body;
  const document = parse(query);

  const result = await experimentalExecuteIncrementally({
    schema,
    document,
    variableValues: variables,
    contextValue: { from: "network" },
  });

  if (`initialResult` in result) {
    const encoder = new TextEncoder();
    const generator = async function* (): AsyncIterable<Uint8Array> {
      yield encoder.encode(
        "\r\n---\r\ncontent-type: application/json; charset=utf-8\r\n\r\n" +
          JSON.stringify(result.initialResult) +
          "\r\n---\r\n"
      );
      for await (const partialResult of result.subsequentResults) {
        yield encoder.encode(
          "content-type: application/json; charset=utf-8\r\n\r\n" +
            JSON.stringify(partialResult) +
            (partialResult.hasNext ? "\r\n---\r\n" : "\r\n-----\r\n")
        );
      }
    };
    return new Response(generator() as any, {
      status: 200,
      headers: {
        "Content-Type": 'multipart/mixed; boundary="-"; deferSpec=20220824',
      },
    });
  } else {
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
