import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./ui/layout/Layout";
import { ChatView } from "./ui/chat/ChatView";
import { NewChatPage } from "./ui/layout/NewChatPage";
import { PlaceholderPage } from "./ui/layout/PlaceholderPage";
import { ChatsPage } from "./ui/layout/ChatsPage";
import { ArtifactsPage } from "./ui/artifacts/ArtifactsPage";
import { ArtifactDetailPage } from "./ui/artifacts/ArtifactDetailPage";
import { SettingsLayout } from "./ui/settings/SettingsLayout";
import { SettingsGeneral } from "./ui/settings/SettingsGeneral";
import { SettingsThemePresets } from "./ui/settings/SettingsThemePresets";
import { SettingsProvider } from "./ui/settings/SettingsProvider";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/new" replace /> },
      { path: "new", element: <NewChatPage /> },
      { path: "search", element: <ChatsPage autoFocusSearch /> },
      { path: "chats", element: <ChatsPage /> },
      { path: "projects", element: <PlaceholderPage /> },
      { path: "artifacts", element: <ArtifactsPage /> },
      { path: "artifacts/:sessionId/:artifactId", element: <ArtifactDetailPage /> },
      { path: "code", element: <PlaceholderPage /> },
      { path: "chat/:id", element: <ChatView /> },
      {
        path: "settings",
        element: <SettingsLayout />,
        children: [
          { index: true, element: <Navigate to="/settings/general" replace /> },
          { path: "general", element: <SettingsGeneral /> },
          { path: "theme-presets", element: <SettingsThemePresets /> },
          { path: "provider", element: <SettingsProvider /> },
        ],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
