import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate } from "react-router";
import { RouterProvider } from "react-router/dom";

import { ChartsDocsShell, NotFoundPage, chartsDocsPages } from "./App";
import "./styles.css";

const router = createBrowserRouter([
  { element: <Navigate replace to="/docs/getting-started" />, path: "/" },
  ...chartsDocsPages.map((page) => ({ element: <ChartsDocsShell />, path: page.path })),
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
