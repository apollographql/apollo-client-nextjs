import { ApolloLink, Operation, NextLink, FetchResult } from "@apollo/client";
import {
  Observable,
  hasDirectives,
  mergeIncrementalData,
} from "@apollo/client/utilities";

export interface DebounceMultipartResponsesConfig {
  maxDelay: number;
}

export class DebounceMultipartResponsesLink extends ApolloLink {
  private maxDelay: number;

  constructor(config: DebounceMultipartResponsesConfig) {
    super();
    this.maxDelay = config.maxDelay;
  }
  request(operation: Operation, forward?: NextLink) {
    if (!forward) {
      throw new Error("This is not a terminal link!");
    }

    const operationContainsMultipartDirectives = hasDirectives(
      ["defer"],
      operation.query
    );

    const upstream = forward(operation);
    if (!operationContainsMultipartDirectives) return upstream;

    // TODO: this could be overwritten with a `@DebounceMultipartResponsesConfig(maxDelay: 1000)` directive on the operation
    const maxDelay = this.maxDelay;
    let accumulatedData: FetchResult, maxDelayTimeout: NodeJS.Timeout;

    return new Observable<FetchResult>((subscriber) => {
      const upstreamSubscription = upstream.subscribe({
        next: (result) => {
          if (accumulatedData) {
            if (accumulatedData.data && "incremental" in result) {
              accumulatedData.data = mergeIncrementalData(
                accumulatedData.data,
                result
              );
            } else if (result.data) {
              accumulatedData.data = result.data;
            }

            if (result.errors)
              accumulatedData.errors = [
                ...(accumulatedData.errors || []),
                ...(result.errors || []),
              ];

            // the spec is not mentioning on how to merge these, so we just do a shallow merge?
            if (result.extensions)
              accumulatedData.extensions = {
                ...accumulatedData.extensions,
                ...result.extensions,
              };
          } else {
            accumulatedData = result;
          }
          if (!maxDelay) {
            cleanUp();
          } else if (!maxDelayTimeout) {
            maxDelayTimeout = setTimeout(cleanUp, maxDelay);
          }
        },
        error: (error) => {
          if (maxDelayTimeout) clearTimeout(maxDelayTimeout);
          subscriber.error(error);
        },
        complete: () => {
          if (maxDelayTimeout) {
            clearTimeout(maxDelayTimeout);
            cleanUp();
          }
          subscriber.complete();
        },
      });

      function cleanUp() {
        subscriber.next(accumulatedData);
        subscriber.complete();
        upstreamSubscription.unsubscribe();
      }
    });
  }
}
