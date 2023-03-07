# Changelog

## 0.0.21
* Fix bug where `createCache` subscribers were not notified after `evict` or `evictAll`.
* Renamed `STATUS_NOT_STARTED` ("not-started") status to `STATUS_NOT_FOUND` ("not-found") for better semantics.

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