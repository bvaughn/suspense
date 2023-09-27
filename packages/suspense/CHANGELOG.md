# Changelog

## 0.0.48
* Fix edge case bug in `useStreamingValue` that sometimes caused updates to be dropped

## 0.0.47
* Upgrade Preconstruct to fix missing `suspense.development.cjs.mjs` in the published package.

## 0.0.46
* Add convenience `read` method to `createStreamingCache` for blocking (Suspense) reads
* Add `error` property to `createStreamingCache` values; `useStreamingValue` hook will now return the reason for a streaming failure

## 0.0.45
* Add convenience `readAsync` method to `createStreamingCache` for blocking (async) reads

## 0.0.44
* `createCache` and `createIntervalCache`  methods `subscribeToStatus` renamed to `subscribe` and parameters changed to also include value or error
* `createCache` subscribers notified after value explicitly cached via `cache`
* `useCacheMutation` sync mutation notifies subscribers after mutation

The change in subscription APIs was made to simplify interop with imperative code.

## 0.0.43
* Fix potential update loop in `useImperativeCacheValue` from nested object properties

## 0.0.42
* Fix potential update loop in `useImperativeCacheValue`

## 0.0.41
* `useImperativeCacheValue` supports async mutations made with `useCacheMutation`; (specifically, it returns a previously resolved value when status is _pending_ due to a mutation).

## 0.0.40
* Added opt-in debug logging per cache (`enableDebugLogging` config) as well as globally (`enableDebugLogging` export) for development builds.
* Add (DEV-only) warning to `createIntervalCache` and `createStreamingCache` for non-unique cache keys– specifically warning about the key containing an `Object` case as a string.

## 0.0.39
* Add (DEV-only) warning to `createCache` for non-unique cache keys– specifically warning about the key containing an `Object` case as a string.

## 0.0.38
* [32](https://github.com/bvaughn/suspense/pull/32): Build release bundle with Preconstruct

## 0.0.37
* `createIntervalCache` edge case bug fix caught by enabling TSC `--noUncheckedIndexedAccess` flag.

## 0.0.36
* `createIntervalCache` removes `comparePoints` param (as it is no longer needed).

## 0.0.35
* `createIntervalCache` supports partial results via new options parameter `options.returnAsPartial(resultsArray)`.
* `createIntervalCache` methods `getValue` and `getStatus` better handle sub-regions of already-loaded intervals.
* `createIntervalCache` no longer supports string points, only `number` and `BigInt` types are supported.

## 0.0.34
* `createExternallyManagedCache` cache updated to support caching errors (via `cacheError` method); `cache` method renamed to `cacheValue` to differentiate.

## 0.0.33
* README changes

## 0.0.32
* Improved `useImperativeCacheValue` generics.

## 0.0.31
* Add optional `immutable` config param to `createCache` to enable optimizing rendering performance for immutable caches. (See [this Loom video](https://www.loom.com/share/dde355b8a9e643adb146768cbd943d39) for background information.)

## 0.0.30
* Add new edge-case externally-managed cache type (`createExternallyManagedCache`) as a convenience wrapper around `createCache`.

## 0.0.29
* Edge case bugfix: Calling `cache` while a value is being loaded will resolve/replace the pending record.

## 0.0.28
* Add `useImperativeIntervalCacheValue` hook for imperatively loading and subscribing to `createIntervalCache` data.
* Add `getValue` and `getValueIfCached` methods to `createIntervalCache` type.

## 0.0.27
* Removed `useWeakRef` config option for `createCache` and replaced with `getCache` option in order to support LRU type caches in addition to `WeakRef` based caches. Thanks to @cevr for contributing to this release!

## 0.0.26
* Add `getStatus` and `subscribe` methods to interval caches.
* Add `useIntervalCacheStatus` hook for interval caches.

## 0.0.25
Parameters passed to `createCache` methods `load` and `getKey` are no longer spread in order to avoid potential parameter mismatch caused by optional parameters.

Before:
```ts
createCache<[bool: boolean, num: number, str: string], boolean>({
  getKey: async (bool, num, str) => {
    // ...
  },
  load: async (bool, num, str) => {
    // ...
  }
});
```

After:
```ts
createCache<[bool: boolean, num: number, str: string], boolean>({
  // Note the added [] wrapper
  getKey: async ([bool, num, str]) => {
    // ...
  },
  load: async ([bool, num, str]) => {
    // ...
  }
});
```

## 0.0.24
* Refactored internal structure of `Deferred` type to expose `promise` rather than proxy it.
* Expose several additional low-level utilities for working with `Record` values (useful for creating custom caches).

## 0.0.23
* Rewrote deferred internals to wrap a `Promise` and implement the full `Promise` API rather than `PromiseLike`.

## 0.0.22
* Fixed type definition for internal `ResolvedRecordData` structure.

## 0.0.21
* Fix bug where `createCache` subscribers were not notified after `evict` or `evictAll`.
* Renamed `STATUS_NOT_STARTED` ("not-started") status to `STATUS_NOT_FOUND` ("not-found") for better semantics.
* Exposed/exported some of the lower-level record utilities for creating custom cache types.

## 0.0.20
* Fixed type definition for `createStreamingCache` `StreamingCacheLoadOptions` param.

## 0.0.19
* Updated `createStreamingCache` to support non-array types (e.g. string) as well.
* Renamed `useStreamingValues` to `useStreamingValue`.

## 0.0.18
* Fixed some edge case garbage collection bugs when `WeakRef`s are used to store values.

## 0.0.17
* Renamed `useCacheValue` to `useImperativeCacheValue` to make it clearer that the hook is an escape hatch.

## 0.0.16
* Add `useCacheValue` hook for loading values using the imperative cache API rather than Suspense.

## 0.0.15
* Removed `Thenable` in favor of built-in `PromiseLike` since it works better with async/await types
* Replaced `isThenable` with `isPromiseLike`

## 0.0.14
* Renamed `fetchSuspense` to `read` and `fetchAsync` to `readAsync`

## 0.0.13
* Add `useCacheMutation` hook with support for sync and async cache mutations.
* Add `evictAll` API to all cache types.
* Added dependency on React `experimental` release channel (required for mutation/invalidation support).

## 0.0.12
* Fixed external dependency version.

## 0.0.11
* Add `createIntervalCache` type for incrementally loading and merging sets of values over time.

## 0.0.10
* `createCache` uses `WeakRef` and `FinalizationRegistry` by default to avoid memory leaks; this can be disabled with a new `useWeakRef` config flag (see #12).

## 0.0.9
* Change `createCache` and `createStreamingCache` signatures to use named parameters.
* Add `evictAll` method to `createCache` and `createStreamingCache` types.
* Add `createSingleEntryCache` convenience method.

## 0.0.8
* `useStreamingValue` waits until commit boundaries before throttling, to avoid overwhelming the scheduler if there are slow renders.

## 0.0.7
* `createCache` and `createStreamingCache` add support for cancellation via [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal).

## 0.0.6
* `createStreamingCache` catches errors and automatically rejects a pending streaming value.

## 0.0.5
* `cache.getStatus` and `useCacheStatus` now return an explicit `"not-started"` string rather than `undefined` for keys that have not been fetched.
* Add `status` attribute to the return value for `useStreamingValue` hook.

## 0.0.4
* Renamed "thennable" to "thenable" to more closely align with [pre-existing terminology](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#thenables).

## 0.0.3
* Swapped order of `getCacheKey` and `loadData` functions for both `createCache` and `createStreamingCache` so that `getCacheKey` could be optional.

## 0.0.2
The initial release includes the following APIs:
#### Cache types
* [`createCache`](https://suspense-npm.vercel.app/createCache)
* [`createStreamingCache`](https://suspense-npm.vercel.app/createStreamingCache)
#### React hooks
* [`useCacheStatus`](https://suspense-npm.vercel.app/useCacheStatus)
* [`useStreamingValue`](https://suspense-npm.vercel.app/useStreamingValue)
#### Utilities
* [`createDeferred`](https://suspense-npm.vercel.app/createDeferred)
* [`isThenable`](https://suspense-npm.vercel.app/isThenable)

Special thanks to [@hbenl](https://github.com/hbenl) and [@markerikson](https://github.com/markerikson) for helping to co-develop these ideas at [@replayio](https://github.com/replayio), and to [@donavon](https://github.com/donavon) for lending the NPM package name.

## 0.0.1
Placeholder release.