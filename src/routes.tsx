import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ChatView } from "./pages/ChatView";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { SettingsLayout } from "./pages/SettingsLayout";
import { SettingsGeneral } from "./pages/SettingsGeneral";
import { SettingsProvider } from "./pages/SettingsProvider";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <ChatView /> },
      { path: "new", element: <ChatView /> },
      { path: "search", element: <PlaceholderPage /> },
      { path: "customize", element: <PlaceholderPage /> },
      { path: "chats", element: <PlaceholderPage /> },
      { path: "projects", element: <PlaceholderPage /> },
      { path: "artifacts", element: <PlaceholderPage /> },
      { path: "code", element: <PlaceholderPage /> },
      { path: "chat/:id", element: <ChatView /> },
      {
        path: "settings",
        element: <SettingsLayout />,
        children: [
          { index: true, element: <Navigate to="/settings/general" replace /> },
          { path: "general", element: <SettingsGeneral /> },
          { path: "provider", element: <SettingsProvider /> },
        ],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
