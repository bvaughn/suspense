import { Interval, Utilities } from "interval-utilities";

export type CachedIntervals<Point> = {
  // TODO Cache failed attempts?
  // failed: Interval<Point>[];
  loaded: Interval<Point>[];
  pending: Interval<Point>[];
};

export type FoundIntervals<Point> = {
  missing: Interval<Point>[];
  pending: Interval<Point>[];
};

export function findIntervals<Point>(
  cachedIntervals: CachedIntervals<Point>,
  targetInterval: Interval<Point>,
  intervalUtils: Utilities<Point>
): FoundIntervals<Point> {
  // Remove intervals that have already finished loading
  const { b: pendingOrNotLoadedIntervals } = intervalUtils.separateAll(
    cachedIntervals.loaded,
    [targetInterval]
  );

  if (pendingOrNotLoadedIntervals.length === 0) {
    // Everything has already been loaded
    return { missing: [], pending: [] };
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
      missing: missingMerged,
      pending: pendingFiltered,
    };
  }
}
