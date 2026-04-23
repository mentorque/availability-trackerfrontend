import { useState, useEffect } from "react";
import { usersApi, mentorsApi } from "../api/client";

/**
 * EditProfileModal
 * 
 * Admin tool to manage user and mentor metadata (tags, domains, etc.)
 */
export default function EditProfileModal({ entity, type = "USER", onClose, onSuccess }) {
  const [tags, setTags] = useState("");
  const [domain, setDomain] = useState("");
  const [description, setDescription] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [communicationScore, setCommunicationScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize from entity
  useEffect(() => {
    if (entity) {
      setTags((entity.tags || []).join(", "));
      setDomain(entity.domain || "");
      setDescription(entity.description || "");
      setCompanyType(entity.companyType || "");
      setCommunicationScore(entity.communicationScore || 0);
    }
  }, [entity]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = {
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        domain: domain.trim() || null,
        description: description.trim() || null,
      };

      if (type === "MENTOR") {
        data.companyType = companyType || null;
        data.communicationScore = parseFloat(communicationScore) || 0;
        await mentorsApi.update(entity.id, data);
      } else {
        await usersApi.update(entity.id, data);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!entity) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            Edit Metadata: {entity.name || entity.email}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-1.5 underline decoration-slate-600">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="e.g. React, Node.js, Python"
            />
          </div>

          {/* Domain */}
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-1.5 underline decoration-slate-600">
              Domain / Specialization
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="e.g. Software Development, UI/UX"
            />
          </div>

          {type === "MENTOR" && (
            <div className="grid grid-cols-2 gap-4">
              {/* Company Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-1.5 underline decoration-slate-600">
                  Company Type
                </label>
                <select
                  value={companyType}
                  onChange={(e) => setCompanyType(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none"
                >
                  <option value="">Select type</option>
                  <option value="big_tech">Big Tech</option>
                  <option value="startup">Startup</option>
                  <option value="mid_size">Mid-size</option>
                </select>
              </div>

              {/* Communication Score */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-1.5 underline decoration-slate-600">
                  Comm. Score (0-5)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={communicationScore}
                  onChange={(e) => setCommunicationScore(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-1.5 underline decoration-slate-600">
              Description / Bio
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
              placeholder="Detailed description for recommendation engine analysis..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 shadow-lg shadow-blue-900/20 active:scale-95 transition disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Metadata"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium px-6 py-3 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
