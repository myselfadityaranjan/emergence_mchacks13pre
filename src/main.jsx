import React from "react";
import ReactDOM from "react-dom/client";
import App from "./ui/App.jsx";
import "./ui/styles/globals.css";
import "./ui/styles/animations.css";
import "./ui/styles/components.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
