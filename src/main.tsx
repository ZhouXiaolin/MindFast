import React from "react";
import ReactDOM from "react-dom/client";
import "./i18n";
import "./index.css";
import "@mariozechner/pi-web-ui/app.css";
import App from "./App";
import { ThemeProvider } from "./contexts/ThemeProvider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
