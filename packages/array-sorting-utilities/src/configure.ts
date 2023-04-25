import { CompareValues, Utilities } from "./types";

export function configure<Value>(
  compareValues: CompareValues<Value>
): Utilities<Value> {
  function find(sortedItems: Value[], targetItem: Value): Value | null {
    const index = findIndex(sortedItems, targetItem, true);
    if (index >= 0) {
      return sortedItems[index]!;
    } else {
      return null;
    }
  }

  // Note that for non-exact matches to work
  // the comparison function should return more fine-grained delta values than the typical -1, 0, or 1.
  function findIndex(
    sortedItems: Value[],
    targetItem: Value,
    exactMatch = true
  ): number {
    let lowIndex = 0;
    let highIndex = sortedItems.length - 1;
    let middleIndex = -1;

    while (lowIndex <= highIndex) {
      middleIndex = (lowIndex + highIndex) >>> 1;

      const currentItem = sortedItems[middleIndex]!;
      const value = compareValues(targetItem, currentItem);
      if (value === 0) {
        return middleIndex;
      } else if (value > 0) {
        lowIndex = middleIndex + 1;
      } else {
        highIndex = middleIndex - 1;
      }
    }

    if (exactMatch) {
      return -1;
    } else {
      switch (sortedItems.length) {
        case 0:
          return -1;
        case 1:
          return 0;
      }

      const value = compareValues(targetItem, sortedItems[middleIndex]!);
      if (value === 0) {
        return middleIndex;
      } else {
        let lowIndex = middleIndex;
        let highIndex = middleIndex;

        if (value > 0) {
          highIndex = Math.min(middleIndex + 1, sortedItems.length - 1);
        } else {
          lowIndex = Math.max(0, middleIndex - 1);
        }

        return Math.abs(compareValues(targetItem, sortedItems[lowIndex]!)) <
          Math.abs(compareValues(targetItem, sortedItems[highIndex]!))
          ? lowIndex
          : highIndex;
      }
    }
  }

  function findInsertIndex(sortedItems: Value[], item: Value): number {
    let lowIndex = 0;
    let highIndex = sortedItems.length;
    while (lowIndex < highIndex) {
      let middleIndex = (lowIndex + highIndex) >>> 1;
      const currentItem = sortedItems[middleIndex]!;
      if (compareValues(item, currentItem) > 0) {
        lowIndex = middleIndex + 1;
      } else {
        highIndex = middleIndex;
      }
    }

    return lowIndex;
  }

  function insert(sortedItems: Value[], item: Value): Value[] {
    const insertAtIndex = findInsertIndex(sortedItems, item);

    sortedItems.splice(insertAtIndex, 0, item);

    return sortedItems;
  }

  return {
    find,
    findIndex,
    findInsertIndex,
    insert,
  };
}
