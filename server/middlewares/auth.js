import { auth } from "express-oauth2-jwt-bearer";

export const requireAuth = auth({
  audience: "https://texttolearn/api",
  issuerBaseURL: "https://dev-1dhhjax6mpux65zz.us.auth0.com/",
  tokenSigningAlg: "RS256",
});
