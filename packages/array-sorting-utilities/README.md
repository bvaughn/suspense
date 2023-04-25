# array-sorting-utilities

Dependency-free utility functions for efficiently managing sorted arrays.

This package exists primarily in support of the `suspense` package, though it may be useful in other contexts.

## Installation

```sh
# NPM
npm install array-sorting-utilities

# Yarn
yarn add array-sorting-utilities
```

## Configuration

Configure the utility to compare values of a specific type. For example...

To compare values with numeric ids/keys:

```ts
import { configure } from "point-utilities";

const utils = configure<number>((a: Object, b: Object) => a.key - b.key);
```

To compare values with string ids/keys:

```ts
import { configure } from "point-utilities";

const utils = configure<number>((a: Object, b: Object) => a.key.localeCompare(b));
```

## API

#### `find(sortedItems: Value[], targetItem: Value): Value | null`

If an item matching the one specified can be found the array, this value will return it. Else it will return null.

#### `findIndex(sortedItems: Value[], targetItem: Value, exactMatch?: boolean): number`

Returns the index of an item matching the one specified (or -1 if no match is found).

By default, `exactMatch` is true. Setting this parameter to false will return the index of the closest match.

#### `findInsertIndex(sortedItems: Value[], item: Value): number`

Returns the insertion index for the specified value.

#### `insert(sortedItems: Value[], item: Value): Value[]`

Inserts a value.