import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ComposerView } from "./components/ComposerView";
import { PlaceholderPage } from "./pages/PlaceholderPage";

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
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
