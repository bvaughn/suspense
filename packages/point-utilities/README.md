# point-utilities

Dependency-free utility functions for performing comparison operations

This package exists primarily in support of the `suspense` package, though it may be useful in other contexts.

## Installation

```sh
# NPM
npm install point-utilities

# Yarn
yarn add point-utilities
```

## Configuration

Configure the utility to compare points of a specific type. For example...

To compare numeric points:

```ts
import { configure } from "point-utilities";

const utils = configure<number>((a: number, b: number) => a - b);
```

To compare string points:

```ts
import { configure } from "point-utilities";

const utils = configure<string>((a: string, b: string) => a.localeCompare(b));
```

To compare `BigInt` points (e.g. using [`extra-bigint`](https://www.npmjs.com/package/extra-bigint)):

```ts
import { compare } from "extra-bigint";
import { configure } from "point-utilities";

const utils = configure<BigInt>(compare);
```

## API

#### `utils.compare(a: Interval<Point>, b: Interval<Point>): number`

Base comparison function (used for other utility types below).

```js
utils.compare(1, 1); // 0
utils.compare(0, 2); // -1
utils.compare(5, 1); // 1
```

#### `utils.equals(a: Point, b: Point): boolean`

Compares two points for equality.

```js
utils.equals(1, 1); // true
utils.equals(1, 3); // false
```

#### `utils.greaterThan(a: Point, b: Point): boolean`

Compares two points to see if one is greater than the other.

```js
utils.greaterThan(3, 0); // true
utils.greaterThan(1, 1); // false
utils.greaterThan(2, 8); // false
```

#### `utils.greaterThanOrEqualTo(a: Point, b: Point): boolean`

Compares two points to see if one is greater or equal to the other.

```js
utils.greaterThanOrEqualTo(3, 0); // true
utils.greaterThanOrEqualTo(0, 0); // true
utils.greaterThanOrEqualTo(4, 5); // false
```

#### `utils.lessThan(a: Point, b: Point): boolean`

Compares two points to see if one is less than the other.

```js
utils.lessThan(0, 2); // true
utils.lessThan(5, 5); // false
utils.lessThan(2, 0); // false
```

#### `utils.lessThanOrEqualTo(a: Point, b: Point): boolean`

Compares two points to see if one is less or equal to the other.

```js
utils.lessThanOrEqualTo(3, 4); // true
utils.lessThanOrEqualTo(4, 4); // true
utils.lessThanOrEqualTo(5, 0); // false
```
