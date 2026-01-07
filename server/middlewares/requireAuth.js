import { expressjwt } from "express-jwt";
import jwksRsa from "jwks-rsa";

const requireAuth = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: "https://dev-1dhhjax6mpux65zz.us.auth0.com/.well-known/jwks.json",
  }),
  audience: "https://texttolearn/api",
  issuer: "https://dev-1dhhjax6mpux65zz.us.auth0.com/",
  algorithms: ["RS256"],
});

export default requireAuth;