import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ComposerView } from "./components/ComposerView";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { SettingsLayout } from "./pages/SettingsLayout";
import { SettingsGeneral } from "./pages/SettingsGeneral";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <ComposerView /> },
      { path: "new", element: <ComposerView /> },
      { path: "search", element: <PlaceholderPage /> },
      { path: "customize", element: <PlaceholderPage /> },
      { path: "chats", element: <PlaceholderPage /> },
      { path: "projects", element: <PlaceholderPage /> },
      { path: "artifacts", element: <PlaceholderPage /> },
      { path: "code", element: <PlaceholderPage /> },
      { path: "chat/:id", element: <PlaceholderPage /> },
      {
        path: "settings",
        element: <SettingsLayout />,
        children: [
          { index: true, element: <Navigate to="/settings/general" replace /> },
          { path: "general", element: <SettingsGeneral /> },
          { path: "account", element: <PlaceholderPage /> },
          { path: "privacy", element: <PlaceholderPage /> },
          { path: "billing", element: <PlaceholderPage /> },
          { path: "capabilities", element: <PlaceholderPage /> },
          { path: "connectors", element: <PlaceholderPage /> },
          { path: "claude-code", element: <PlaceholderPage /> },
        ],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
