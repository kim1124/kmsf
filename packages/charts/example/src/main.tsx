import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter, Navigate } from "react-router";
import { RouterProvider } from "react-router/dom";

import { ChartWorkspacePage, GridstackPage, NotFoundPage } from "./App";
import "./styles.css";

const router = createHashRouter([
  { element: <Navigate replace to="/charts/line" />, path: "/" },
  { element: <ChartWorkspacePage />, path: "/charts/:type" },
  { element: <ChartWorkspacePage />, path: "/charts/:type/examples/:exampleId" },
  { element: <GridstackPage />, path: "/gridstack" },
  { element: <NotFoundPage />, path: "*" },
]);

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element was not found.");
}

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
