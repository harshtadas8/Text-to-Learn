import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { Auth0Provider } from "@auth0/auth0-react";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Auth0Provider
      domain="dev-1dhhjax6mpux65zz.us.auth0.com"
      clientId="KfE6EobQBoScvDx92QDFtdZeaVxhscuK"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "https://texttolearn/api",
        scope: "openid profile email",
      }}
      cacheLocation="localstorage"
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);
