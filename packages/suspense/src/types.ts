import { STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED } from "./constants";

export type StatusPending = typeof STATUS_PENDING;
export type StatusRejected = typeof STATUS_REJECTED;
export type StatusResolved = typeof STATUS_RESOLVED;
export type Status = StatusPending | StatusRejected | StatusResolved;

export type PendingRecord<T> = {
  status: StatusPending;
  value: Deferred<T>;
};

export type ResolvedRecord<T> = {
  status: StatusResolved;
  value: T;
};

export type RejectedRecord = {
  status: StatusRejected;
  value: any;
};

export type Record<T> = PendingRecord<T> | ResolvedRecord<T> | RejectedRecord;

export type StreamingSubscribeCallback = () => void;
export type StatusCallback = (status: Status | undefined) => void;
export type UnsubscribeCallback = () => void;

// This type defines the subset of the Promise API that React uses (the .then method to add success/error callbacks).
// You can use a Promise for this, but Promises have a downside (the microtask queue).
// You can also create your own "thennable" if you want to support synchronous resolution/rejection.
export interface Thennable<T> {
  then(
    onFulfill: (value: T) => any,
    onReject?: (err: any) => any
  ): void | Thennable<T>;
}

// Convenience type used by Suspense caches.
// Adds the ability to resolve or reject a pending Thennable.
export interface Deferred<T> extends Thennable<T> {
  reject(error: any): void;
  resolve(value: T): void;
}

export interface Cache<Params extends Array<any>, Value> {
  cache(value: Value, ...params: Params): void;
  evict(...params: Params): boolean;
  getStatus(...params: Params): Status | undefined;
  getValue(...params: Params): Value;
  getValueIfCached(...params: Params): Value | undefined;
  fetchAsync(...params: Params): Thennable<Value> | Value;
  fetchSuspense(...params: Params): Value;
  prefetch(...params: Params): void;
  subscribeToStatus(
    callback: StatusCallback,
    ...params: Params
  ): UnsubscribeCallback;
}

export type RejectRange = (error: Error) => void;
export type ResolveRange<Value> = (values: Value[]) => void;

// export interface RangeCache<Range, Params extends Array<any>, Value> {
// }

export interface StreamingValues<Value, AdditionalData = undefined> {
  complete: boolean;
  data: AdditionalData | undefined;
  progress: number | undefined;
  resolver: Thennable<StreamingValues<Value, AdditionalData>>;
  status: Status;
  subscribe(callback: StreamingSubscribeCallback): UnsubscribeCallback;
  values: Value[] | undefined;
}

export interface StreamingProgressNotifier<Value, AdditionalData = undefined> {
  update: (values: Value[], progress?: number, data?: AdditionalData) => void;
  resolve: () => void;
  reject: (error: any) => void;
}

export interface StreamingCache<
  Params extends Array<any>,
  Value,
  AdditionalData = undefined
> {
  evict(...params: Params): boolean;
  prefetch(...params: Params): void;
  stream(...params: Params): StreamingValues<Value, AdditionalData>;
}
