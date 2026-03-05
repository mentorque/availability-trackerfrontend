import { useEffect } from "react";

export default function SSO() {
  useEffect(() => {
    console.log("[SSO] Starting SSO handler");
    console.log("[SSO] window.location.search:", window.location.search);

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const role = params.get("role");
    const userId = params.get("userId");
    const email = params.get("email");

    console.log("[SSO] Parsed params:", { token, role, userId, email });

    // Resolve role, including admin tokens from main site (isAdmin flag) and USER role
    let resolvedRole = role;
    if (!resolvedRole && token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        resolvedRole = payload.role || (payload.isAdmin ? "ADMIN" : "MENTOR");
        console.log("[SSO] Resolved role from token payload:", payload, "=>", resolvedRole);
      } catch (err) {
        console.warn("[SSO] Failed to decode token payload, falling back to role param", err);
        resolvedRole = role;
      }
    }

    // Fallback: if still missing/undefined, treat as USER
    if (!resolvedRole || resolvedRole === "undefined") {
      resolvedRole = "USER";
    }

    console.log("[SSO] Final resolvedRole:", resolvedRole);

    if (!token) {
      console.log("[SSO] Missing token, redirecting to /login");
      window.location.href = "/login";
      return;
    }

    try {
      console.log("[SSO] Setting localStorage values");
      localStorage.setItem("token", token);
      localStorage.setItem("role", resolvedRole);
      localStorage.setItem("userId", userId);
      localStorage.setItem("userRole", resolvedRole);
      localStorage.setItem("user", JSON.stringify({ id: userId }));
      if (email) {
        localStorage.setItem("userEmail", email);
      }

      console.log("[SSO] localStorage set successfully", {
        token: localStorage.getItem("token"),
        role: localStorage.getItem("role"),
        userId: localStorage.getItem("userId"),
        userRole: localStorage.getItem("userRole"),
        user: localStorage.getItem("user"),
      });
    } catch (err) {
      console.error("[SSO] Error setting localStorage, redirecting to /login", err);
      window.location.href = "/login";
      return;
    }

    // Redirect based on resolved role
    if (resolvedRole === "ADMIN") {
      console.log("[SSO] Redirecting to admin dashboard at /admin");
      window.location.href = "/admin";
    } else if (resolvedRole === "MENTOR") {
      console.log("[SSO] Redirecting to mentor dashboard at /mentor");
      window.location.href = "/mentor";
    } else if (resolvedRole === "USER") {
      console.log("[SSO] Redirecting to user availability at /availability");
      window.location.href = "/availability";
    } else {
      console.log("[SSO] Unknown or missing role, redirecting to /login");
      window.location.href = "/login";
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950">
      <div className="text-slate-400">Signing you in...</div>
    </div>
  );
}

 