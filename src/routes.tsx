import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ChatView } from "./pages/ChatView";
import { NewChatPage } from "./pages/NewChatPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { ChatsPage } from "./pages/ChatsPage";
import { ArtifactsPage } from "./pages/ArtifactsPage";
import { ArtifactDetailPage } from "./pages/ArtifactDetailPage";
import { SettingsLayout } from "./pages/SettingsLayout";
import { SettingsGeneral } from "./pages/SettingsGeneral";
import { SettingsThemePresets } from "./pages/SettingsThemePresets";
import { SettingsProvider } from "./pages/SettingsProvider";

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
      { path: "artifacts/:sessionId/:filename", element: <ArtifactDetailPage /> },
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
