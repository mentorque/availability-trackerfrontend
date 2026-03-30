import { get, post, patch, del } from "./client.js";

/**
 * USER: Create a mentoring request
 */
export async function createRequest(callType, notes = "") {
  return post("/api/requests", { callType, notes });
}

/**
 * USER: Get my requests
 */
export async function getMyRequests() {
  return get("/api/requests/my");
}

/**
 * USER: Cancel a pending request
 */
export async function cancelRequest(requestId) {
  return del(`/api/requests/${requestId}`);
}

/**
 * ADMIN: Get all requests (with optional filters)
 */
export async function getAllRequests(status = "", callType = "") {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (callType) params.append("callType", callType);
  
  const query = params.toString();
  return get(`/api/admin/requests${query ? `?${query}` : ""}`);
}

/**
 * ADMIN: Get single request details
 */
export async function getRequestById(requestId) {
  return get(`/api/admin/requests/${requestId}`);
}

/**
 * ADMIN: Fulfill request (link meeting to request)
 */
export async function fulfillRequest(requestId, meetingId) {
  return post(`/api/admin/requests/${requestId}/fulfill`, { meetingId });
}

/**
 * ADMIN: Update request status
 */
export async function updateRequestStatus(requestId, status) {
  return patch(`/api/admin/requests/${requestId}/status`, { status });
}
