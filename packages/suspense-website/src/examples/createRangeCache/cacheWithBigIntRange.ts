const getPointForValue = (value: any) => null as any;
const load = async (start: any, end: any) => null as any;

type Value = any;

// REMOVE_BEFORE

import { compare } from "extra-bigint";
import { createRangeCache } from "suspense";

type Point = bigint;

createRangeCache<Point, [], Value>({
  load,
  comparePoints: compare,
  getPointForValue,
});
