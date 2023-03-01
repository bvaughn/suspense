const getPointForValue = (value: any) => null as any;
const load = async (start: any, end: any) => null as any;

declare module "big.js" {
  export function eq(a: bigint, b: bigint): boolean;
  export function gt(a: bigint, b: bigint): boolean;
}

type Value = any;

// REMOVE_BEFORE

import { eq, gt } from "big.js";
import { createRangeCache } from "suspense";

type Point = bigint;

function comparePoints(a: Point, b: Point): number {
  if (eq(a, b)) {
    return 0;
  } else if (gt(a, b)) {
    return 1;
  } else {
    return -1;
  }
}

createRangeCache<Point, [], Value>({
  load,
  comparePoints,
  getPointForValue,
});
