import type { Operation, NextLink, FetchResult } from "@apollo/client/index.js";
import { ApolloLink } from "@apollo/client/index.js";
import {
  Observable,
  hasDirectives,
  mergeIncrementalData,
} from "@apollo/client/utilities/index.js";

interface AccumulateMultipartResponsesConfig {
  /**
   * The maximum delay in milliseconds
   * from receiving the first response
   * until the accumulated data will be flushed
   * and the connection will be closed.
   */
  cutoffDelay: number;
}

/**
 *
 * This link can be used to "debounce" the initial response of a multipart request. Any incremental data received during the `cutoffDelay` time will be merged into the initial response.
 *
 * After `cutoffDelay`, the link will return the initial response, even if there is still incremental data pending, and close the network connection.
 *
 * If `cutoffDelay` is `0`, the link will immediately return data as soon as it is received, without waiting for incremental data, and immediately close the network connection.
 *
 * @example
 * ```ts
 * new AccumulateMultipartResponsesLink({
 *   // The maximum delay in milliseconds
 *   // from receiving the first response
 *   // until the accumulated data will be flushed
 *   // and the connection will be closed.
 *   cutoffDelay: 100,
 *  });
 * ```
 *
 * @public
 */
export class AccumulateMultipartResponsesLink extends ApolloLink {
  private maxDelay: number;

  constructor(config: AccumulateMultipartResponsesConfig) {
    super();
    this.maxDelay = config.cutoffDelay;
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

    // TODO: this could be overwritten with a `@AccumulateMultipartResponsesConfig(maxDelay: 1000)` directive on the operation
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

            if (result.errors) {
              accumulatedData.errors = [
                ...(accumulatedData.errors || []),
                ...(result.errors || []),
              ];
            }

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
            flushAccumulatedData();
          } else if (!maxDelayTimeout) {
            maxDelayTimeout = setTimeout(flushAccumulatedData, maxDelay);
          }
        },
        error: (error) => {
          if (maxDelayTimeout) clearTimeout(maxDelayTimeout);
          subscriber.error(error);
        },
        complete: () => {
          if (maxDelayTimeout) {
            clearTimeout(maxDelayTimeout);
            flushAccumulatedData();
          }
          subscriber.complete();
        },
      });

      function flushAccumulatedData() {
        subscriber.next(accumulatedData);
        subscriber.complete();
        upstreamSubscription.unsubscribe();
      }

      return function cleanUp() {
        clearTimeout(maxDelayTimeout);
        upstreamSubscription.unsubscribe();
      };
    });
  }
}
