import { Interval, Utilities } from "interval-utilities";

export type CachedIntervals<Point> = {
  failed: Interval<Point>[];
  loaded: Interval<Point>[];
  partial: Interval<Point>[];
  pending: Interval<Point>[];
};

export type FoundIntervals<Point> = {
  containsFailedResults: boolean;
  containsPartialResults: boolean;
  missing: Interval<Point>[];
  pending: Interval<Point>[];
};

export function findIntervals<Point>(
  cachedIntervals: CachedIntervals<Point>,
  targetInterval: Interval<Point>,
  intervalUtils: Utilities<Point>
): FoundIntervals<Point> {
  let targetIntervals = [targetInterval];

  // Retry new intervals only if they are smaller than existing partial intervals
  // or if there's a partial overlap
  const retryIntersectingIntervals =
    cachedIntervals.partial.find(
      (partialInterval) =>
        !intervalUtils.equals(partialInterval, targetInterval) &&
        !intervalUtils.contains(targetInterval, partialInterval) &&
        (intervalUtils.contains(partialInterval, targetInterval) ||
          intervalUtils.intersects(partialInterval, targetInterval))
    ) != null;

  // Find overlapping intervals containing partial results
  // Don't re-request those intervals unless requesting smaller ranges
  const { ab: partialAndRequestedIntervals, b: requestedIntervals } =
    intervalUtils.separateAll(cachedIntervals.partial, targetIntervals);

  // Find overlapping intervals containing failed results
  // Don't re-request those intervals unless requesting smaller ranges
  const { ab: failedIntervals } = intervalUtils.separateAll(
    cachedIntervals.failed,
    targetIntervals
  );

  targetIntervals = retryIntersectingIntervals
    ? intervalUtils.mergeAll(
        ...partialAndRequestedIntervals,
        ...requestedIntervals
      )
    : requestedIntervals;

  const containsFailedResults = failedIntervals.length > 0;
  const containsPartialResults =
    !retryIntersectingIntervals && partialAndRequestedIntervals.length > 0;

  // Remove intervals that have already finished loading
  const { b: pendingOrNotLoadedIntervals } = intervalUtils.separateAll(
    cachedIntervals.loaded,
    targetIntervals
  );

  if (pendingOrNotLoadedIntervals.length === 0) {
    // Everything has already been loaded
    return {
      containsFailedResults,
      containsPartialResults,
      missing: [],
      pending: [],
    };
  } else {
    // Separate the pending (in progress) intervals from the not-yet-loaded intervals
    const { b: missing, ab: pending } = intervalUtils.separateAll(
      cachedIntervals.pending,
      pendingOrNotLoadedIntervals
    );

    // Handle awkward edge cases by merging missing intervals
    // and filtering out any pending intervals that are contained within merged missing intervals
    const missingMerged = intervalUtils.mergeAll(...missing);
    const pendingFiltered = pending.filter((pendingInterval) => {
      const contained = missingMerged.find((missingInterval) =>
        intervalUtils.contains(missingInterval, pendingInterval)
      );
      return !contained;
    });

    return {
      containsFailedResults,
      containsPartialResults,
      missing: missingMerged,
      pending: pendingFiltered,
    };
  }
}
