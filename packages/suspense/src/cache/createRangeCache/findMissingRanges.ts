import { PointUtils, RangeTuple, RangeUtils } from "../../types";

// TODO Handle race between pending and loaded ranges

export function findMissingRanges<Point>(
  loadedRanges: RangeTuple<Point>[],
  targetRange: RangeTuple<Point>,
  rangeUtils: RangeUtils<Point>,
  pointUtils: PointUtils<Point>
): RangeTuple<Point>[] {
  if (loadedRanges.length === 0) {
    // Nothing loaded yet; we need to load the whole range
    return [targetRange];
  } else {
    const container = loadedRanges.find((loadedRange) =>
      rangeUtils.contains(loadedRange, targetRange)
    );
    if (container) {
      // This range has already been loaded fully
      return [];
    }
  }

  const startIndex = loadedRanges.findIndex((loadedRange) =>
    rangeUtils.intersects(loadedRange, targetRange)
  );

  if (startIndex < 0) {
    // This range has not been loaded at all yet
    return [targetRange];
  } else {
    // The range has been partially loaded; now we need to fill in the gap(s)

    const missingRanges: RangeTuple<Point>[] = [];

    let currentIndex = startIndex;
    let currentRange = loadedRanges[currentIndex];

    while (true) {
      const remainder = rangeUtils.subtract(currentRange, targetRange);
      if (remainder.length > 0) {
        targetRange = remainder.pop();

        missingRanges.push(...remainder);
      }

      currentIndex++;
      currentRange = loadedRanges[currentIndex];

      if (
        !currentRange ||
        pointUtils.lessThan(targetRange[1], currentRange[0])
      ) {
        missingRanges.push(targetRange);
        break;
      }
    }

    return missingRanges;
  }
}
