import { get, post } from "./client.js";

export async function listUsers() {
  return get("/api/admin/users");
}

export async function listMentors() {
  return get("/api/admin/mentors");
}

export async function createUser(data) {
  return post("/api/admin/create-user", data);
}

/**
 * @deprecated Use availabilityApi.getWeekly({ entity_id, entity_type, weekStart }) instead
 * This function is kept for backward compatibility only.
 * Get availability for an entity (user or mentor) - admin context only
 */
export async function getAvailabilityForEntity(entityId, entityType = "USER", weekStart) {
  const q = new URLSearchParams({
    entityType,
    ...(weekStart && { weekStart }),
  }).toString();
  return get(`/api/admin/availability/${entityId}${q ? `?${q}` : ""}`);
}

/**
 * Get availability for user (backward compatible wrapper)
 * @deprecated Use availabilityApi.getWeekly() instead
 */
export async function getAvailabilityForUser(userId, weekStart) {
  return getAvailabilityForEntity(userId, "USER", weekStart);
}

/**
 * Get overlapping slots for an entity (admin context only)
 * This remains in admin.js because overlap checking is typically admin functionality.
 * 
 * @param {string} entityId - UUID of user or mentor
 * @param {string} entityType - "USER" or "MENTOR" (default: "USER")
 * @param {string} startTime - ISO 8601 UTC start time
 * @param {string} endTime - ISO 8601 UTC end time
 */
export async function getOverlappingSlotsForEntity(entityId, entityType = "USER", startTime, endTime) {
  const q = new URLSearchParams({
    entityType,
    startTime,
    endTime,
  }).toString();
  return get(`/api/admin/availability/${entityId}/overlap?${q}`);
}

/**
 * Get overlapping slots for user (backward compatible wrapper)
 * @deprecated Use getOverlappingSlotsForEntity instead
 */
export async function getOverlappingSlots(userId, startTime, endTime) {
  return getOverlappingSlotsForEntity(userId, "USER", startTime, endTime);
}

/**
 * @deprecated Use callsApi.bookCall() instead
 */
export async function scheduleMeeting(data) {
  return post("/api/admin/meetings", data);
}
