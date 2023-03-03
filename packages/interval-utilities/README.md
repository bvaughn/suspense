# interval-utilities

Dependency-free utility functions for performing mathematical set operations on intervals and arrays of intervals

This package exists primarily in support of the `suspense` package, though it may be useful in other contexts.

## Installation

```sh
# NPM
npm install interval-utilities

# Yarn
yarn add interval-utilities
```

## Configuration

Configure the utility to compare intervals of a specific type. For example...

To compare numeric intervals:

```ts
import { configure } from "interval-utilities";

const utils = configure<number>((a: number, b: number) => a - b);
```

To compare string intervals:

```ts
import { configure } from "interval-utilities";

const utils = configure<string>((a: string, b: string) => a.localeCompare(b));
```

To compare `BigInt` intervals (e.g. using [`extra-bigint`](https://www.npmjs.com/package/extra-bigint)):

```ts
import { compare } from "extra-bigint";
import { configure } from "interval-utilities";

const utils = configure<BigInt>(compare);
```

## API

#### `utils.compare(a: Interval<Point>, b: Interval<Point>): number`

Base comparison function (used for other utility types below).

```js
utils.compare([1, 2], [1, 2]); // 0
utils.compare([0, 3], [2, 5]); // -1
utils.compare([2, 4], [1, 3]); // 1
```

#### `utils.contains(a: Interval<Point>, b: Interval<Point>): boolean`

Compares two intervals to see if one contains the other.

```js
utils.compare([1, 5], [2, 2]); // true
utils.compare([2, 3], [1, 5]); // false
```

#### `utils.equals(a: Interval<Point>, b: Interval<Point>): boolean`

Compares two intervals for equality.

```js
utils.equals([1, 2], [1, 2]); // true
utils.equals([1, 2], [1, 3]); // false
```

#### `greaterThan(a: Interval<Point>, b: Interval<Point>): boolean`

Compares two intervals to see if one is greater than the other.

```js
utils.greaterThan([0, 3], [2, 5]); // false
utils.greaterThan([2, 4], [1, 3]); // true
```

#### `greaterThanOrEqualTo(a: Interval<Point>, b: Interval<Point>): boolean`

Compares two intervals to see if one is greater than or equal to the other.

```js
utils.greaterThanOrEqualTo([0, 3], [2, 5]); // false
utils.greaterThanOrEqualTo([2, 4], [1, 3]); // true
```

#### `intersects(a: Interval<Point>, b: Interval<Point>): boolean`

Compares two intervals to see if they intersect.

```js
utils.intersects([1, 5], [1, 2]); // true
utils.intersects([2, 4], [1, 3]); // true
utils.intersects([1, 4], [5, 8]); // false
```

#### `lessThan(a: Interval<Point>, b: Interval<Point>): boolean`

Compares two intervals to see if one is less than or equal to the other.

```js
utils.lessThan([0, 3], [2, 5]); // true
utils.lessThan([2, 4], [1, 3]); // false
```

#### `lessThanOrEqualTo(a: Interval<Point>, b: Interval<Point>): boolean`

Compares two intervals to see if one is less than or equal to the other.

```js
utils.lessThanOrEqualTo([0, 3], [2, 5]); // true
utils.lessThanOrEqualTo([2, 4], [1, 3]); // false
```

#### `merge(a: Interval<Point>, b: Interval<Point>): Interval<Point>[]`

Merges two intervals (if possible).

```js
utils.merge([1, 5], [1, 5]); // [[1, 5]]
utils.merge([1, 5], [2, 4]); // [[1, 5]]
utils.merge([1, 3], [5, 8]); // [[1, 3],[5, 8]]
```

#### `mergeAll(...intervals: Interval<Point>[]): Interval<Point>[]`

Merges a set of intervals into the smallest subset.

```js
utils.mergeAll([1, 5], [1, 5], [1, 5]);
// -> [[1, 5]]
utils.mergeAll([1, 5], [2, 7]);
// -> [[1, 7]]
utils.mergeAll([1, 5], [6, 9], [10, 15]);
// -> [[1, 5],[6, 9],[10, 15]]
```

#### `separate(a: Interval<Point>, b: Interval<Point>): SeparatedInterval<Point>`

Separates a pair of intervals into component parts: values only in a, values only in b, and values in both.

```js
utils.separate([-10, -5], [5, 10]);
// -> {
//   a: [[-10, -5]],
//   b: [[5, 10]],
//   ab: [],
// }
```

#### `separateAll(a: Interval<Point>[], b: Interval<Point>[]): SeparatedInterval<Point>`

Separates a set of intervals into component parts: values only in a, values only in b, and values in both.

```js
utils.separateAll(
  [
    [0, 3],
    [5, 5],
  ],
  [
    [1, 1],
    [3, 3],
  ]
);
// -> {
//   a: [
//     [0, 1],
//     [1, 3],
//     [5, 5],
//   ],
//   b: [],
//   ab: [
//     [1, 1],
//     [3, 3],
//   ],
// }
```

#### `sort(...intervals: Interval<Point>[]): Interval<Point>[]`

Sort interval in ascending order.

```js
utils.sort([2, 4], [1, 10], [1, 5], [8, 8]);
// -> [[1, 5],[1, 10],[2, 4],[8, 8]]

utils.sort([1, 5], [4, 10], [3, 8], [0, 2])
// -> [[0, 2], [1, 5], [3, 8], [4, 10]]
```
