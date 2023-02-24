# Changelog

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
* [`useStreamingCache`](https://suspense-npm.vercel.app/useStreamingCache)
#### Utilities
* [`createDeferred`](https://suspense-npm.vercel.app/createDeferred)
* [`isThenable`](https://suspense-npm.vercel.app/isThenable)

Special thanks to [@hbenl](https://github.com/hbenl) and [@markerikson](https://github.com/markerikson) for helping to co-develop these ideas at [@replayio](https://github.com/replayio), and to [@donavon](https://github.com/donavon) for lending the NPM package name.

## 0.0.1
Placeholder release.