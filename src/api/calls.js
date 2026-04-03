import { get, post, del } from "./client.js";
import { api } from "./client.js";

/**
 * Book a call (Admin only)
 * POST /api/calls
 * Body: { userId, mentorId, callType, startTime, endTime, notes? }
 *
 * callType values: "RESUME_REVAMP" | "JOB_MARKET_GUIDANCE" | "MOCK_INTERVIEW"
 */
export async function bookCall(data) {
  return post("/api/calls", data);
}

/**
 * List calls
 * GET /api/calls
 * - Admin: sees all (filterable by ?userId, ?mentorId, ?status, ?from, ?to)
 * - User/Mentor: sees only their own
 */
export async function listCalls(params = {}) {
  const q = new URLSearchParams(params).toString();
  return get(`/api/calls${q ? `?${q}` : ""}`);
}

/**
 * Get a single call by ID
 * GET /api/calls/:callId
 */
export async function getCall(callId) {
  return get(`/api/calls/${callId}`);
}

/**
 * Update call status (Admin only)
 * PATCH /api/calls/:callId/status
 * Body: { status: "SCHEDULED" | "COMPLETED" | "CANCELLED" }
 */
export async function updateCallStatus(callId, status) {
  return api("PATCH", `/api/calls/${callId}/status`, { status });
}

/**
 * Cancel a call (Admin only) — soft delete, sets status to CANCELLED
 * DELETE /api/calls/:callId
 */
export async function deleteCall(callId) {
  return del(`/api/calls/${callId}`);
}
