import { getAuth0Client } from "@auth0/auth0-react";

let auth0Client = null;

export const setAuth0Client = (client) => {
  auth0Client = client;
};

export const getAccessToken = async () => {
  if (!auth0Client) return null;

  try {
    return await auth0Client.getTokenSilently();
  } catch (err) {
    console.error("Failed to get access token", err);
    return null;
  }
};
