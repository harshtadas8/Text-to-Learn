import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const client = jwksClient({
  jwksUri: "https://dev-1dhhjax6mpux65zz.us.auth0.com/.well-known/jwks.json",
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err);
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

export const socketAuthMiddleware = (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  jwt.verify(
    token,
    getKey,
    {
      audience: "https://texttolearn/api",
      issuer: "https://dev-1dhhjax6mpux65zz.us.auth0.com/",
      algorithms: ["RS256"],
    },
    (err, decoded) => {
      if (err) {
        return next(new Error("Authentication error: Invalid token"));
      }
      // Attach user to socket
      socket.user = decoded;
      next();
    }
  );
};
