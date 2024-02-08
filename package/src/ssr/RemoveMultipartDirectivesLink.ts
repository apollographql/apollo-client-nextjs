import type {
  Operation,
  NextLink,
  DocumentNode,
} from "@apollo/client/index.js";
import { ApolloLink } from "@apollo/client/index.js";
import type { RemoveDirectiveConfig } from "@apollo/client/utilities/index.js";
import {
  Observable,
  removeDirectivesFromDocument,
} from "@apollo/client/utilities/index.js";
import type { DirectiveNode } from "graphql";

interface RemoveMultipartDirectivesConfig {
  /**
   * Whether to strip fragments with `@defer` directives
   * from queries before sending them to the server.
   *
   * Defaults to `true`.
   *
   * Can be overwritten by adding a label starting
   * with either `"SsrDontStrip"` or `"SsrStrip"` to the
   * directive.
   */
  stripDefer?: boolean;
}

function getDirectiveArgumentValue(directive: DirectiveNode, argument: string) {
  return directive.arguments?.find((arg: any) => arg.name.value === argument)
    ?.value;
}
/**
 * This link is used to strip directives from the query before it is sent to the server.
 * This is used to prevent the server from doing additional work in SSR scenarios where multipart responses cannot be handled anyways.
 * This stripping behaviour can be configured per-directive.
 * It be overridden by adding a label to the directive.
 * In the case this link is configured to strip a directive, but the directive has a label starting with "SsrDontStrip", the directive will not be stripped.
 * In the case this link is configured to not strip a directive, but the directive has a label starting with "SsrStrip", the directive will be stripped.
 * The "starting with" is important, because labels have to be unique per operation. So if you have multiple directives where you want to override the default stipping behaviour,
 * you can do this by annotating them like
 * ```gql
 * query myQuery {
 *   fastField
 *   ... @defer(label: "SsrDontStrip1") {
 *     slowField1
 *   }
 *   ... @defer(label: "SsrDontStrip2") {
 *     slowField2
 *   }
 * }
 * ```
 *
 */

export class RemoveMultipartDirectivesLink extends ApolloLink {
  private stripDirectives: string[] = [];
  constructor(config: RemoveMultipartDirectivesConfig) {
    super();

    if (config.stripDefer !== false) this.stripDirectives.push("defer");
  }

  request(operation: Operation, forward?: NextLink) {
    if (!forward) {
      throw new Error("This is not a terminal link!");
    }
    const { query } = operation;

    let modifiedQuery: DocumentNode | null = query;
    modifiedQuery = removeDirectivesFromDocument(
      this.stripDirectives
        .map<RemoveDirectiveConfig>((directive) => ({
          test(node) {
            let shouldStrip =
              node.kind === "Directive" && node.name.value === directive;
            const label = getDirectiveArgumentValue(node, "label");
            if (
              label?.kind === "StringValue" &&
              label.value.startsWith("SsrDontStrip")
            ) {
              shouldStrip = false;
            }
            return shouldStrip;
          },
          remove: true,
        }))
        .concat({
          test(node) {
            if (node.kind !== "Directive") return false;
            const label = getDirectiveArgumentValue(node, "label");
            return (
              label?.kind === "StringValue" &&
              label.value.startsWith("SsrStrip")
            );
          },
          remove: true,
        }),
      modifiedQuery
    );

    if (modifiedQuery === null) {
      return Observable.of({});
    }

    operation.query = modifiedQuery;

    return forward(operation);
  }
}
