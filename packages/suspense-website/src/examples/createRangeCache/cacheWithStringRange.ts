const getPointForValue = (value: any) => null as any;
const load = async (start: any, end: any) => null as any;

type Value = any;

// REMOVE_BEFORE

import { createRangeCache } from "suspense";

type Point = string;

function compare(a: string, b: string): number {
  return a.localeCompare(b);
}

createRangeCache<Point, [], Value>({
  load,
  comparePoints: compare,
  getPointForValue,
});
