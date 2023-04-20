import React from "react";
import ReactDOM from "react-dom/client";
import "./index.scss";
import MainApp from "./App";
import reportWebVitals from "./reportWebVitals";
import { Provider } from "SiteContext";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "Components/ErrorBoundary";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js");
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
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
          <MainApp />
        </ErrorBoundary>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
