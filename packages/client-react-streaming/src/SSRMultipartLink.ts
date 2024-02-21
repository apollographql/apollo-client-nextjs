import { ApolloLink } from "@apollo/client/index.js";
import { RemoveMultipartDirectivesLink } from "./RemoveMultipartDirectivesLink.js";
import { AccumulateMultipartResponsesLink } from "./AccumulateMultipartResponsesLink.js";

interface SSRMultipartLinkConfig {
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
  /**
   * The maximum delay in milliseconds
   * from receiving the first response
   * until the accumulated data will be flushed
   * and the connection will be closed.
   *
   * Defaults to `0`.
   */
  cutoffDelay?: number;
}

export class SSRMultipartLink extends ApolloLink {
  constructor(config: SSRMultipartLinkConfig = {}) {
    const combined = ApolloLink.from([
      new RemoveMultipartDirectivesLink({
        stripDefer: config.stripDefer,
      }),
      new AccumulateMultipartResponsesLink({
        cutoffDelay: config.cutoffDelay || 0,
      }),
    ]);
    super(combined.request);
  }
}
