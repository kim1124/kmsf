import { createBrowserRouter } from "react-router";
import { App } from "../App";
import { HomePage } from "../pages/HomePage";
import { SettingsPage } from "../pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [
      { index: true, Component: HomePage },
      { path: "settings", Component: SettingsPage },
    ],
  },
]);
