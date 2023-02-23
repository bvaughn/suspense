import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import CreateCacheRoute from "./src/routes/createCache";
import CreateStreamingCacheRoute from "./src/routes/createStreamingCache";
import CreateWakeableRoute from "./src/routes/createWakeable";
import IsThennableRoute from "./src/routes/isThennable";
import PageNotFoundRoute from "./src/routes/PageNotFound";
import HomeRoute from "./src/routes/Home";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeRoute />,
    errorElement: <PageNotFoundRoute />,
  },
  {
    path: "/examples/createCache",
    element: <CreateCacheRoute />,
  },
  {
    path: "/examples/createStreamingCache",
    element: <CreateStreamingCacheRoute />,
  },
  {
    path: "examples/createWakeable",
    element: <CreateWakeableRoute />,
  },
  {
    path: "examples/isThennable",
    element: <IsThennableRoute />,
  },
]);

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
