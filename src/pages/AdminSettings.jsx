export default function AdminSettings() {
  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-semibold text-white">Admin Settings</h1>
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-6">
        <h2 className="text-lg font-medium text-white mb-2">Platform</h2>
        <p className="text-slate-400 text-sm">
          This platform uses simple JWT authentication. User accounts are created by admins via the
          dashboard. No external OAuth or SSO is required.
        </p>
      </div>
    </div>
  );
}
