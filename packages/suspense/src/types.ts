import {
  STATUS_ABORTED,
  STATUS_NOT_FOUND,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "./constants";

export type StatusNotFound = typeof STATUS_NOT_FOUND;
export type StatusPending = typeof STATUS_PENDING;
export type StatusAborted = typeof STATUS_ABORTED;
export type StatusRejected = typeof STATUS_REJECTED;
export type StatusResolved = typeof STATUS_RESOLVED;

export type Status =
  | StatusNotFound
  | StatusPending
  | StatusAborted
  | StatusRejected
  | StatusResolved;

export type PendingRecordData<Type> = {
  readonly abortController: AbortController;
  readonly deferred: Deferred<Type>;
  readonly status: StatusPending;
};
export type ResolvedRecordData<Type> = {
  readonly metadata: unknown;
  readonly status: StatusResolved;
  readonly value: Type;
};
export type RejectedRecordData = {
  readonly error: any;
  readonly status: StatusRejected;
};

export type PendingRecord<Type> = {
  data: PendingRecordData<Type>;
};
export type ResolvedRecord<Type> = {
  data: ResolvedRecordData<Type>;
};
export type RejectedRecord = {
  data: RejectedRecordData;
};

export type Record<Type> =
  | PendingRecord<Type>
  | ResolvedRecord<Type>
  | RejectedRecord;

export type RecordData<Type> =
  | PendingRecordData<Type>
  | ResolvedRecordData<Type>
  | RejectedRecordData;

export interface SubscriptionDataNotFound {
  readonly status: StatusNotFound;
}
export interface SubscriptionDataPending {
  readonly status: StatusPending;
}
export interface SubscriptionDataAborted {
  readonly status: StatusAborted;
}
export interface SubscriptionDataRejected {
  readonly error: any;
  readonly status: StatusRejected;
}
export interface SubscriptionDataResolved<Type> {
  readonly status: StatusResolved;
  readonly value: Type;
}

export type SubscriptionData<Type> =
  | SubscriptionDataNotFound
  | SubscriptionDataPending
  | SubscriptionDataAborted
  | SubscriptionDataRejected
  | SubscriptionDataResolved<Type>;

export type StreamingSubscribeCallback = () => void;
export type SubscriptionCallback<Value> = (
  data: SubscriptionData<Value>
) => void;
export type UnsubscribeCallback = () => void;

// Convenience type used by Suspense caches.
// Adds the ability to resolve or reject a pending PromiseLike.
export interface Deferred<Type> {
  debugLabel: string | undefined;
  promise: Promise<Type>;
  reject(error: any): void;
  resolve(value?: Type): void;
}

// Cache types

export interface Cache<Params extends any[], Value> {
  abort(...params: Params): boolean;
  cache(value: Value, ...params: Params): void;
  disableDebugLogging(): void;
  enableDebugLogging(): void;
  evict(...params: Params): boolean;
  evictAll(): void;
  getStatus(...params: Params): Status;
  getValue(...params: Params): Value;
  getValueIfCached(...params: Params): Value | undefined;
  prefetch(...params: Params): void;
  read(...params: Params): Value;
  readAsync(...params: Params): PromiseLike<Value> | Value;
  subscribe(
    callback: SubscriptionCallback<Value>,
    ...params: Params
  ): UnsubscribeCallback;
}

export type CacheLoadOptions = {
  signal: AbortSignal;
};

// Interval cache types

export type IntervalCache<Point, Params extends any[], Value> = {
  abort(...params: Params): boolean;
  disableDebugLogging(): void;
  enableDebugLogging(): void;
  evict(...params: Params): boolean;
  evictAll(): boolean;
  getStatus(start: Point, end: Point, ...params: Params): Status;
  getValue(start: Point, end: Point, ...params: Params): Value[];
  getValueIfCached(
    start: Point,
    end: Point,
    ...params: Params
  ): Value[] | undefined;
  readAsync(
    start: Point,
    end: Point,
    ...params: Params
  ): PromiseLike<Value[]> | Value[];
  isPartialResult: (value: Value[]) => boolean;
  read(start: Point, end: Point, ...params: Params): Value[];
  subscribe(
    callback: SubscriptionCallback<Value[]>,
    start: Point,
    end: Point,
    ...params: Params
  ): UnsubscribeCallback;
};

export type IntervalCacheLoadOptions<Value> = {
  returnAsPartial: (values: Value[]) => Value[];
  signal: AbortSignal;
};

export type ComparisonFunction<Type> = (a: Type, b: Type) => number;

export type GetPointForValue<Point, Value> = (value: Value) => Point;

// Streaming cache types

export interface StreamingValue<Value, AdditionalData = undefined> {
  complete: boolean;
  data: AdditionalData | undefined;
  progress: number | undefined;
  resolver: PromiseLike<StreamingValue<Value, AdditionalData>>;
  status: Status;
  subscribe(callback: StreamingSubscribeCallback): UnsubscribeCallback;
  value: Value | undefined;
}

export interface StreamingCacheLoadOptions<Value, AdditionalData = undefined> {
  update: (value: Value, progress?: number, data?: AdditionalData) => void;
  resolve: () => void;
  reject: (error: any) => void;
  signal: AbortSignal;
}

export interface StreamingCache<
  Params extends any[],
  Value,
  AdditionalData = undefined
> {
  abort(...params: Params): boolean;
  disableDebugLogging(): void;
  enableDebugLogging(): void;
  evict(...params: Params): boolean;
  evictAll(): boolean;
  prefetch(...params: Params): void;
  stream(...params: Params): StreamingValue<Value, AdditionalData>;
}

export interface CacheMap<Key, Value> {
  clear(): void;
  delete(key: Key): boolean;
  get(key: Key): Value | undefined;
  has(key: Key): boolean;
  set(key: Key, value: Value): this;
}

// Externally managed cache variant

export type ExternallyManagedCache<Params extends any[], Value> = Omit<
  Cache<Params, Value>,
  "cache"
> & {
  cacheError(error: any, ...params: Params): void;
  cacheValue(value: Value, ...params: Params): void;
};

// Hook types

export type ImperativeErrorResponse = {
  error: any;
  status: StatusRejected;
  value: any;
};
export type ImperativePendingResponse<Value> = {
  error: undefined;
  status: StatusPending;
  value: Value | undefined;
};
export type ImperativeResolvedResponse<Value> = {
  error: undefined;
  status: StatusResolved;
  value: Value;
};

export type ImperativeIntervalErrorResponse = ImperativeErrorResponse;
export type ImperativeIntervalPendingResponse<Value> =
  ImperativePendingResponse<Value>;
export type ImperativeIntervalResolvedResponse<Value> =
  ImperativeResolvedResponse<Value> & {
    isPartialResult: boolean;
  };
