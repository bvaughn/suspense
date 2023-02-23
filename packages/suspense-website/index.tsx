import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import {
  CREATE_CACHE,
  CREATE_DEFERRED,
  CREATE_STREAMING_CACHE,
  IS_THENNABLE,
  USE_CACHE_STATUS,
  USE_STREAMING_CACHE,
} from "./src/routes/config";

import CreateCacheRoute from "./src/routes/createCache";
import CreateDeferredRoute from "./src/routes/createDeferred";
import CreateStreamingCacheRoute from "./src/routes/createStreamingCache";
import HomeRoute from "./src/routes/Home";
import IsThennableRoute from "./src/routes/isThennable";
import PageNotFoundRoute from "./src/routes/PageNotFound";
import UseCacheStatusRoute from "./src/routes/useCacheStatus";
import UseStreamingCacheRoute from "./src/routes/useStreamingCache";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeRoute />,
    errorElement: <PageNotFoundRoute />,
  },
  {
    path: CREATE_CACHE,
    element: <CreateCacheRoute />,
  },
  {
    path: CREATE_DEFERRED,
    element: <CreateDeferredRoute />,
  },
  {
    path: CREATE_STREAMING_CACHE,
    element: <CreateStreamingCacheRoute />,
  },
  {
    path: IS_THENNABLE,
    element: <IsThennableRoute />,
  },
  {
    path: USE_CACHE_STATUS,
    element: <UseCacheStatusRoute />,
  },
  {
    path: USE_STREAMING_CACHE,
    element: <UseStreamingCacheRoute />,
  },
]);

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
