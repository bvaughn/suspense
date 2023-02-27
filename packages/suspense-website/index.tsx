import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import {
  CREATE_CACHE,
  CREATE_DEFERRED,
  CREATE_SINGLE_ENTRY_CACHE,
  CREATE_STREAMING_CACHE,
  EXAMPLE_ABORT_A_REQUEST,
  EXAMPLE_FETCH_WITH_STATUS,
  EXAMPLE_MUTATING_A_CACHE_VALUE,
  EXAMPLE_STREAMING_CACHE,
  IS_THENNABLE,
  USE_CACHE_STATUS,
  USE_STREAMING_CACHE,
} from "./src/routes/config";

import CreateCacheRoute from "./src/routes/api/createCache";
import CreateDeferredRoute from "./src/routes/api/createDeferred";
import CreateSingleEntryCacheRoute from "./src/routes/api/createSingleEntryCache";
import CreateStreamingCacheRoute from "./src/routes/api/createStreamingCache";
import HomeRoute from "./src/routes/Home";
import IsThenableRoute from "./src/routes/api/isThenable";
import PageNotFoundRoute from "./src/routes/PageNotFound";
import UseCacheStatusRoute from "./src/routes/api/useCacheStatus";
import UseStreamingValuesRoute from "./src/routes/api/useStreamingValues";
import AbortingRequestRoute from "./src/routes/examples/aborting-a-request";
import MutatingCacheValueRoute from "./src/routes/examples/mutating-a-cache-value";
import RenderingStatusWhileFetchingRoute from "./src/routes/examples/rendering-status-while-fetching";
import CreatingStreamingCacheRoute from "./src/routes/examples/streaming-cache";
import ScrollToTop from "./src/components/ScrollToTop";

const rootElement = document.getElementById("root");
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
          path={CREATE_SINGLE_ENTRY_CACHE}
          element={<CreateSingleEntryCacheRoute />}
        />
        <Route
          path={CREATE_STREAMING_CACHE}
          element={<CreateStreamingCacheRoute />}
        />
        <Route
          path={EXAMPLE_ABORT_A_REQUEST}
          element={<AbortingRequestRoute />}
        />
        <Route
          path={EXAMPLE_FETCH_WITH_STATUS}
          element={<RenderingStatusWhileFetchingRoute />}
        />
        <Route
          path={EXAMPLE_MUTATING_A_CACHE_VALUE}
          element={<MutatingCacheValueRoute />}
        />
        <Route
          path={EXAMPLE_STREAMING_CACHE}
          element={<CreatingStreamingCacheRoute />}
        />
        <Route path={IS_THENNABLE} element={<IsThenableRoute />} />
        <Route path={USE_CACHE_STATUS} element={<UseCacheStatusRoute />} />
        <Route
          path={USE_STREAMING_CACHE}
          element={<UseStreamingValuesRoute />}
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
