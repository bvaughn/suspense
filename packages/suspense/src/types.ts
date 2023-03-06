import {
  STATUS_ABORTED,
  STATUS_NOT_STARTED,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "./constants";

export type StatusNotStarted = typeof STATUS_NOT_STARTED;
export type StatusPending = typeof STATUS_PENDING;
export type StatusAborted = typeof STATUS_ABORTED;
export type StatusRejected = typeof STATUS_REJECTED;
export type StatusResolved = typeof STATUS_RESOLVED;

export type Status =
  | StatusNotStarted
  | StatusPending
  | StatusAborted
  | StatusRejected
  | StatusResolved;

export type PendingRecord<Type> = {
  status: StatusPending;
  value: {
    abortController: AbortController;
    deferred: Deferred<Type>;
  };
};

export type ResolvedRecord<Type> = {
  status: StatusResolved;
  value: Type extends Object ? Type | WeakRef<Type> : Type;
};

export type RejectedRecord = {
  status: StatusRejected;
  value: any;
};

export type Record<Type> =
  | PendingRecord<Type>
  | ResolvedRecord<Type>
  | RejectedRecord;

export type StreamingSubscribeCallback = () => void;
export type StatusCallback = (status: Status) => void;
export type UnsubscribeCallback = () => void;

// This type defines the subset of the Promise API that React uses (the .then method to add success/error callbacks).
// You can use a Promise for this, but Promises have a downside (the microtask queue).
// You can also create your own "thenable" if you want to support synchronous resolution/rejection.
// Note that if a thenable is rejected, its onFulfill callback will be called with undefined.
export interface Thenable<Type> {
  then(
    onFulfill: (value?: Type) => any,
    onReject?: (err: any) => any
  ): void | Thenable<Type>;
}

// Convenience type used by Suspense caches.
// Adds the ability to resolve or reject a pending Thenable.
export interface Deferred<Type> extends Thenable<Type> {
  reject(error: any): void;
  resolve(value?: Type): void;
}

// Cache types

export interface Cache<Params extends Array<any>, Value> {
  abort(...params: Params): boolean;
  cache(value: Value, ...params: Params): void;
  evict(...params: Params): boolean;
  evictAll(): boolean;
  getStatus(...params: Params): Status;
  getValue(...params: Params): Value;
  getValueIfCached(...params: Params): Value | undefined;
  fetchAsync(...params: Params): Thenable<Value> | Value;
  fetchSuspense(...params: Params): Value;
  prefetch(...params: Params): void;
  subscribeToStatus(
    callback: StatusCallback,
    ...params: Params
  ): UnsubscribeCallback;
}

export type CacheLoadOptions = {
  signal: AbortSignal;
};

// Interval cache types

export type IntervalCache<Point, Params extends Array<any>, Value> = {
  abort(...params: Params): boolean;
  evict(...params: Params): boolean;
  evictAll(): boolean;
  fetchAsync(
    start: Point,
    end: Point,
    ...params: Params
  ): Thenable<Value[]> | Value[];
  fetchSuspense(start: Point, end: Point, ...params: Params): Value[];
};

export type IntervalCacheLoadOptions = {
  signal: AbortSignal;
};

export type ComparisonFunction<Type> = (a: Type, b: Type) => number;

export type GetPointForValue<Point, Value> = (value: Value) => Point;

// Streaming cache types

export interface StreamingValues<Value, AdditionalData = undefined> {
  complete: boolean;
  data: AdditionalData | undefined;
  progress: number | undefined;
  resolver: Thenable<StreamingValues<Value, AdditionalData>>;
  status: Status;
  subscribe(callback: StreamingSubscribeCallback): UnsubscribeCallback;
  values: Value[] | undefined;
}

export interface StreamingCacheLoadOptions<Value, AdditionalData = undefined> {
  update: (values: Value[], progress?: number, data?: AdditionalData) => void;
  resolve: () => void;
  reject: (error: any) => void;
  signal: AbortSignal;
}

export interface StreamingCache<
  Params extends Array<any>,
  Value,
  AdditionalData = undefined
> {
  abort(...params: Params): boolean;
  evict(...params: Params): boolean;
  evictAll(): boolean;
  prefetch(...params: Params): void;
  stream(...params: Params): StreamingValues<Value, AdditionalData>;
}
