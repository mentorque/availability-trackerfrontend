import { api, get, post } from "./client.js";

export async function login(data) {
  return api("POST", "/api/auth/login", data, { skipAuthRedirect: true });
}

export async function me() {
  return api("GET", `/api/auth/me?_=${Date.now()}`, null, { skipAuthRedirect: true });
}
