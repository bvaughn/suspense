import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import CreateCacheRoute from "./src/routes/CreateCache";
import CreateStreamingCacheRoute from "./src/routes/CreateStreamingCache";
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
]);

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
