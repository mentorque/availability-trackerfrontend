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
 * Update mentor profile metadata (tags, domain, description, companyType, communicationScore)
 */
export async function updateMentorProfile(mentorId, data) {
  const { put } = await import("./client.js");
  return put(`/api/admin/mentors/${mentorId}`, data);
}

/**
 * Update user profile metadata (tags, domain, description)
 */
export async function updateUserProfile(userId, data) {
  const { put } = await import("./client.js");
  return put(`/api/admin/users/${userId}`, data);
}

/**
 * Get availability for a user or mentor - admin context only
 */
export async function getAvailabilityForUser(userId, weekStart) {
  const q = weekStart ? `?weekStart=${weekStart}` : "";
  return get(`/api/admin/availability/${userId}${q}`);
}

/**
 * Get overlapping slots between a user and time range
 */
export async function getOverlappingSlots(userId, startTime, endTime) {
  const q = new URLSearchParams({ startTime, endTime }).toString();
  return get(`/api/admin/availability/${userId}/overlap?${q}`);
}

export async function scheduleMeeting(data) {
  return post("/api/admin/meetings", data);
}
