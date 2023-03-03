import { Interval, Utilities } from "interval-utilities";

export type CachedRanges<Point> = {
  // TODO Cache failed attempts?
  // failed: Interval<Point>[];
  loaded: Interval<Point>[];
  pending: Interval<Point>[];
};

export type FoundRanges<Point> = {
  missing: Interval<Point>[];
  pending: Interval<Point>[];
};

export function findRanges<Point>(
  cachedRanges: CachedRanges<Point>,
  targetRange: Interval<Point>,
  rangeUtils: Utilities<Point>
): FoundRanges<Point> {
  // Remove ranges that have already finished loading
  const { b: pendingOrNotLoadedRanges } = rangeUtils.separateAll(
    cachedRanges.loaded,
    [targetRange]
  );

  if (pendingOrNotLoadedRanges.length === 0) {
    // Everything has already been loaded
    return { missing: [], pending: [] };
  } else {
    // Separate the pending (in progress) ranges from the not-yet-loaded ranges
    const { b: missing, ab: pending } = rangeUtils.separateAll(
      cachedRanges.pending,
      pendingOrNotLoadedRanges
    );

    // Handle awkward edge cases by merging missing ranges
    // and filtering out any pending ranges that are contained within merged missing ranges
    const missingMerged = rangeUtils.mergeAll(...missing);
    const pendingFiltered = pending.filter((pendingRange) => {
      const contained = missingMerged.find((missingRange) =>
        rangeUtils.contains(missingRange, pendingRange)
      );
      return !contained;
    });

    return {
      missing: missingMerged,
      pending: pendingFiltered,
    };
  }
}
