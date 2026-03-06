import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export default function SSO() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const roleParam = searchParams.get("role");
  const userId = searchParams.get("userId");
  const email = searchParams.get("email");

  const { resolvedRole, displayEmail } = useMemo(() => {
    let role = roleParam;
    if (!role && token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        role = payload.role || (payload.isAdmin ? "ADMIN" : "MENTOR");
      } catch {
        role = roleParam;
      }
    }
    if (!role || role === "undefined") role = "USER";
    return {
      resolvedRole: role,
      displayEmail: email || (userId ? `${userId}@sso` : "—"),
    };
  }, [token, roleParam, email, userId]);

  useEffect(() => {
    console.log("[SSO] Starting SSO handler");
    if (!token) {
      window.location.href = "/welcome";
      return;
    }
    try {
      const storage = sessionStorage;
      storage.setItem("token", token);
      storage.setItem("role", resolvedRole);
      storage.setItem("userId", userId);
      storage.setItem("userRole", resolvedRole);
      storage.setItem("user", JSON.stringify({ id: userId }));
      if (email) storage.setItem("userEmail", email);
    } catch (err) {
      console.error("[SSO] Error setting sessionStorage", err);
      window.location.href = "/welcome";
      return;
    }
    try {
      sessionStorage.setItem(
        "sso_show_welcome_modal",
        JSON.stringify({ email: displayEmail, role: resolvedRole })
      );
    } catch (_) {}
    const t = setTimeout(() => {
      if (resolvedRole === "ADMIN") window.location.href = "/admin";
      else if (resolvedRole === "MENTOR") window.location.href = "/mentor";
      else if (resolvedRole === "USER") window.location.href = "/availability";
      else window.location.href = "/welcome";
    }, 2200);
    return () => clearTimeout(t);
  }, [token, resolvedRole, userId, email]);

  if (!token) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/95 backdrop-blur-sm p-4">
      <div
        className="bg-navy-900 border-2 border-blue-500/50 rounded-2xl shadow-2xl p-10 max-w-lg w-full text-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sso-modal-title"
      >
        <p id="sso-modal-title" className="text-slate-400 text-lg mb-6">
          Logging you in…
        </p>
        <p className="text-white text-xl sm:text-2xl font-bold mb-3 break-all">
          {displayEmail}
        </p>
        <p className="text-blue-400 text-xl sm:text-2xl font-semibold">
          {resolvedRole}
        </p>
        <div className="mt-8 h-2 w-full max-w-xs mx-auto rounded-full bg-navy-700 overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full sso-progress-bar"
            style={{ width: "100%" }}
          />
        </div>
      </div>
      <style>{`
        .sso-progress-bar {
          animation: sso-shrink 2.2s linear forwards;
        }
        @keyframes sso-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

 