/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type {
  ExecutionPatchResult,
  FetchResult} from "@apollo/client";
import {
  ApolloLink,
  Observable,
  gql,
} from "@apollo/client";
import { AccumulateMultipartResponsesLink } from "./AccumulateMultipartResponsesLink";
import { test, expect, assert, beforeEach, afterEach, vi } from "vitest";
import { fromPartial } from "@total-typescript/shoehorn";
import type { SubscriptionObserver } from "zen-observable-ts";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.restoreAllMocks();
});

test("normal queries can resolve synchronously", () => {
  const query = gql`
    query {
      fastField
    }
  `;

  const link = new AccumulateMultipartResponsesLink({
    cutoffDelay: 1000,
  });
  const nextLink = getFinalLinkWithExposedObserver();

  const subscriptionStatus = trackSubscriptionStatus(
    ApolloLink.from([link, nextLink.link]).request(fromPartial({ query }))
  );
  assert(nextLink.observer);

  expect(subscriptionStatus).toStrictEqual({
    results: [],
    error: undefined,
    complete: false,
  });

  nextLink.observer.next({ data: { fastField: "fast" } });
  nextLink.observer.complete();
  expect(subscriptionStatus).toStrictEqual({
    results: [{ data: { fastField: "fast" } }],
    error: undefined,
    complete: true,
  });
});

test("deferred query will complete synchonously if maxDelay is 0", () => {
  const query = gql`
    query {
      fastField
      ... @defer {
        slowField
      }
    }
  `;
  const link = new AccumulateMultipartResponsesLink({
    cutoffDelay: 0,
  });
  const nextLink = getFinalLinkWithExposedObserver();

  const subscriptionStatus = trackSubscriptionStatus(
    ApolloLink.from([link, nextLink.link]).request(fromPartial({ query }))
  );
  assert(nextLink.observer);

  expect(subscriptionStatus).toStrictEqual({
    results: [],
    error: undefined,
    complete: false,
  });

  nextLink.observer.next({ data: { fastField: "fast" } });
  // no complete call here!
  expect(nextLink.observer.closed).toBeTruthy();
  expect(subscriptionStatus).toStrictEqual({
    results: [{ data: { fastField: "fast" } }],
    error: undefined,
    complete: true,
  });
});

test("`next` call will be debounced and results will be merged together", () => {
  const query = gql`
    query {
      fastField
      ... @defer {
        slowField
      }
      ... @defer {
        verySlowField
      }
    }
  `;
  const link = new AccumulateMultipartResponsesLink({
    cutoffDelay: 1000,
  });
  const nextLink = getFinalLinkWithExposedObserver();

  const subscriptionStatus = trackSubscriptionStatus(
    ApolloLink.from([link, nextLink.link]).request(fromPartial({ query }))
  );
  assert(nextLink.observer);

  expect(subscriptionStatus).toStrictEqual({
    results: [],
    error: undefined,
    complete: false,
  });

  vi.advanceTimersByTime(100);
  // initial response after 100ms
  nextLink.observer.next({ data: { fastField: "fast" } });

  vi.advanceTimersByTime(100);
  expect(nextLink.observer.closed).toBeFalsy();
  expect(subscriptionStatus).toStrictEqual({
    results: [],
    error: undefined,
    complete: false,
  });

  // incremental response after 200ms
  nextLink.observer.next({
    incremental: [
      {
        path: [],
        data: { slowField: "slow" },
      },
    ],
  });

  vi.advanceTimersByTime(899);
  // at 1099ms, 999ms after the initial response, we still don't have our final result
  expect(nextLink.observer.closed).toBeFalsy();
  expect(subscriptionStatus).toStrictEqual({
    results: [],
    error: undefined,
    complete: false,
  });

  vi.advanceTimersByTime(2);
  // after 1101ms, 1001ms after the initial response, we have our final result
  expect(nextLink.observer.closed).toBeTruthy();
  expect(subscriptionStatus).toStrictEqual({
    results: [{ data: { fastField: "fast", slowField: "slow" } }],
    error: undefined,
    complete: true,
  });

  // more responses would be ignored
  nextLink.observer.next({
    incremental: [
      {
        path: [],
        data: { verySlowField: "very slow" },
      },
    ],
  });

  expect(nextLink.observer.closed).toBeTruthy();
  expect(subscriptionStatus).toStrictEqual({
    results: [{ data: { fastField: "fast", slowField: "slow" } }],
    error: undefined,
    complete: true,
  });
});

function trackSubscriptionStatus(
  observable: Observable<ExecutionPatchResult> | null
) {
  assert(observable);

  const subscriptionStatus = {
    results: [] as FetchResult[],
    error: undefined as Error | undefined,
    complete: false,
  };

  observable.subscribe({
    next: (result) => {
      subscriptionStatus.results.push(result);
    },
    error: (err) => {
      subscriptionStatus.error = err;
    },
    complete: () => {
      subscriptionStatus.complete = true;
    },
  });
  return subscriptionStatus;
}

function getFinalLinkWithExposedObserver() {
  const returnValue = {
    observer: undefined as SubscriptionObserver<FetchResult> | undefined,
    link: new ApolloLink(() => {
      return new Observable((observer) => {
        returnValue.observer = observer;
      });
    }),
  };
  return returnValue;
}
