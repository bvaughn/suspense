import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import {
  CREATE_CACHE,
  CREATE_DEFERRED,
  CREATE_EXTERNALLY_MANAGED_CACHE,
  CREATE_INTERVAL_CACHE,
  CREATE_SINGLE_ENTRY_CACHE,
  CREATE_STREAMING_CACHE,
  GUIDE_ABORT_A_REQUEST,
  GUIDE_FETCH_WITH_STATUS,
  GUIDE_MEMORY_MANAGEMENT,
  GUIDE_MUTATING_A_CACHE_VALUE,
  GUIDE_STREAMING_CACHE,
  IS_PROMISE_LIKE,
  RECORD_AND_RECORD_DATA_UTILS,
  USE_CACHE_MUTATION,
  USE_CACHE_STATUS,
  USE_INTERVAL_CACHE_STATUS,
  USE_IMPERATIVE_CACHE_VALUE,
  USE_IMPERATIVE_INTERVAL_CACHE_VALUES,
  USE_STREAMING_CACHE,
} from "./src/routes/config";

import CreateCacheRoute from "./src/routes/api/createCache";
import CreateDeferredRoute from "./src/routes/api/createDeferred";
import CreateExternallyManagedCacheRoute from "./src/routes/api/createExternallyManagedCache";
import CreateIntervalCacheRoute from "./src/routes/api/createIntervalCache";
import CreateSingleEntryCacheRoute from "./src/routes/api/createSingleEntryCache";
import CreateStreamingCacheRoute from "./src/routes/api/createStreamingCache";
import HomeRoute from "./src/routes/Home";
import IsPromiseLikeRoute from "./src/routes/api/isPromiseLike";
import PageNotFoundRoute from "./src/routes/PageNotFound";
import RecordAndRecordDataUtils from "./src/examples/RecordUtils/RecordUtils";
import UseCacheMutationRoute from "./src/routes/api/useCacheMutation";
import UseCacheStatusRoute from "./src/routes/api/useCacheStatus";
import UseImperativeCacheValueRoute from "./src/routes/api/useImperativeCacheValue";
import UseImperativeIntervalCacheValuesRoute from "./src/routes/api/useImperativeIntervalCacheValues";
import UseIntervalCacheStatusRoute from "./src/routes/api/useIntervalCacheStatus";
import UseStreamingValueRoute from "./src/routes/api/useStreamingValue";
import AbortingRequestRoute from "./src/routes/examples/aborting-a-request";
import MemoryManagementRoute from "./src/routes/examples/memory-management";
import MutatingCacheValueRoute from "./src/routes/examples/mutating-cache-values";
import RenderingStatusWhileFetchingRoute from "./src/routes/examples/rendering-status-while-fetching";
import CreatingStreamingCacheRoute from "./src/routes/examples/streaming-cache";
import ScrollToTop from "./src/components/ScrollToTop";

const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />

      <Routes>
        <Route path="*" element={<PageNotFoundRoute />} />
        <Route path="/" element={<HomeRoute />} />
        <Route path={CREATE_CACHE} element={<CreateCacheRoute />} />
        <Route path={CREATE_DEFERRED} element={<CreateDeferredRoute />} />
        <Route
          path={CREATE_EXTERNALLY_MANAGED_CACHE}
          element={<CreateExternallyManagedCacheRoute />}
        />
        <Route
          path={CREATE_INTERVAL_CACHE}
          element={<CreateIntervalCacheRoute />}
        />
        <Route
          path={CREATE_SINGLE_ENTRY_CACHE}
          element={<CreateSingleEntryCacheRoute />}
        />
        <Route
          path={CREATE_STREAMING_CACHE}
          element={<CreateStreamingCacheRoute />}
        />
        <Route
          path={GUIDE_ABORT_A_REQUEST}
          element={<AbortingRequestRoute />}
        />
        <Route
          path={GUIDE_FETCH_WITH_STATUS}
          element={<RenderingStatusWhileFetchingRoute />}
        />
        <Route
          path={GUIDE_MEMORY_MANAGEMENT}
          element={<MemoryManagementRoute />}
        />
        <Route
          path={GUIDE_MUTATING_A_CACHE_VALUE}
          element={<MutatingCacheValueRoute />}
        />
        <Route
          path={GUIDE_STREAMING_CACHE}
          element={<CreatingStreamingCacheRoute />}
        />
        <Route path={IS_PROMISE_LIKE} element={<IsPromiseLikeRoute />} />
        <Route
          path={RECORD_AND_RECORD_DATA_UTILS}
          element={<RecordAndRecordDataUtils />}
        />
        <Route path={USE_CACHE_MUTATION} element={<UseCacheMutationRoute />} />
        <Route path={USE_CACHE_STATUS} element={<UseCacheStatusRoute />} />
        <Route
          path={USE_INTERVAL_CACHE_STATUS}
          element={<UseIntervalCacheStatusRoute />}
        />
        <Route
          path={USE_IMPERATIVE_CACHE_VALUE}
          element={<UseImperativeCacheValueRoute />}
        />
        <Route
          path={USE_IMPERATIVE_INTERVAL_CACHE_VALUES}
          element={<UseImperativeIntervalCacheValuesRoute />}
        />
        <Route
          path={USE_STREAMING_CACHE}
          element={<UseStreamingValueRoute />}
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
