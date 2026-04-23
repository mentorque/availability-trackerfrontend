import { get, post } from "./client.js";

/**
 * Standardized GET /api/availability endpoint.
 * 
 * Behavior:
 * - If no entity_id is provided: returns current authenticated user's availability.
 * - If entity_id and entity_type are provided: allows admin to fetch any entity's availability.
 *   (Server will validate admin permissions)
 * 
 * @param {object} params - Query parameters
 * @param {string} params.weekStart - Optional week start date (YYYY-MM-DD)
 * @param {string} params.entity_id - Optional UUID (admin only)
 * @param {string} params.entity_type - Optional entity type "USER" or "MENTOR" (admin only)
 * @returns {Promise} Availability data for the entity
 */
export async function getWeekly(params = {}) {
  const q = new URLSearchParams(params).toString();
  return get(`/api/availability${q ? `?${q}` : ""}`);
}

/**
 * Standardized POST /api/availability endpoint.
 * 
 * Behavior:
 * - Always infers entity_id and entity_type from authenticated user session.
 * - Admin users can override by passing entity_id/entity_type in payload.
 * - Server will validate that authenticated user is either the target entity or an admin.
 * 
 * @param {array} slots - Array of availability slots
 * @param {object} entity - Optional entity override (admin only). Shape: { entity_id, entity_type }
 * @returns {Promise} Success response
 */
export async function saveBatch(slots, entity = {}) {
  const body = { slots };
  
  // Only include entity fields if explicitly provided (admin override)
  if (entity && entity.entity_id) body.entity_id = entity.entity_id;
  if (entity && entity.entity_type) body.entity_type = entity.entity_type;
  
  return post("/api/availability", body);
}
