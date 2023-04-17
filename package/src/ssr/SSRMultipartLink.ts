import { ApolloLink } from "@apollo/client";
import { RemoveMultipartDirectivesLink } from "./RemoveMultipartDirectivesLink";
import { DebounceMultipartResponsesLink } from "./DebounceMultipartResponsesLink";

interface SSRMultipartLinkConfig {
  stripDefer?: boolean;
  maxDelay?: number;
}

export class SSRMultipartLink extends ApolloLink {
  constructor(config: SSRMultipartLinkConfig = {}) {
    const combined = ApolloLink.from([
      new RemoveMultipartDirectivesLink({
        stripDefer: config.stripDefer,
      }),
      new DebounceMultipartResponsesLink({
        maxDelay: config.maxDelay || 0,
      }),
    ]);
    super(combined.request);
  }
}
