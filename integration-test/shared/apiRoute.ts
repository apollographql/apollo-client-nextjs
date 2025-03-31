import {
  experimentalExecuteIncrementally,
  GraphQLSchema,
  parse,
} from "graphql";

/**
 * `@defer`-capable very crude implementation of a GraphQL server.
 */

export function apiRouteHandler({
  schema,
  contextValue = { from: "network" },
}: {
  schema: GraphQLSchema;
  contextValue?: { from: string };
}) {
return async function handler({
  request,
}: {
  request: Request;
}): Promise<Response> {
  const body = await request.json();
  const { query, variables } = body;
  const document = parse(query);
  const result = await experimentalExecuteIncrementally({
    schema,
    document,
    variableValues: variables,
    contextValue,
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
};
}
