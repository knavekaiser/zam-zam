import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "@/SiteContext";
import ErrorBoundary from "Components/ErrorBoundary";
import App from "./App.jsx";
import "./index.scss";

import { registerSW } from "virtual:pwa-register";

if ("serviceWorker" in navigator) {
  // && !/localhost/.test(window.location)) {
  registerSW();
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider>
        <ErrorBoundary
          onError={
            <div className="deathPage">
              <img
                src="/assets/crashpage.webp"
                alt="Illustration of a crashed van"
              />
              <div className="content">
                <h2>Oops!</h2>
                <p>It seems we hit a lamp post.</p>
                <a href="/">Let's give it another go</a>
              </div>
            </div>
          }
        >
          <App />
        </ErrorBoundary>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);
