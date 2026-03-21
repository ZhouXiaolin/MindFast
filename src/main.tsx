import React from "react";
import ReactDOM from "react-dom/client";
import "./ui/i18n";
import "./index.css";
import "katex/dist/katex.min.css";
import "./styles/hljs-theme.css";
import App from "./App";
import { ThemeProvider } from "./ui/contexts/ThemeProvider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
