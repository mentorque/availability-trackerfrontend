/**
 * Badge - Minimal status indicator component
 * 
 * @param {string} text - Badge text
 * @param {string} variant - 'default' | 'success' | 'error' | 'warning' | 'info'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {string} className - Additional classes
 */
export default function Badge({ text, variant = "default", size = "md", className = "" }) {
  const baseClasses = "font-semibold rounded-full inline-flex items-center gap-1 whitespace-nowrap transition-smooth";

  const variantClasses = {
    default: "bg-slate-800 border border-slate-700 text-slate-300",
    success: "bg-green-900/20 border border-green-700/50 text-green-300",
    error: "bg-red-900/20 border border-red-700/50 text-red-300",
    warning: "bg-amber-900/20 border border-amber-700/50 text-amber-300",
    info: "bg-blue-900/20 border border-blue-700/50 text-blue-300",
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-2.5 py-1.5",
    lg: "text-base px-3 py-2",
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {text}
    </span>
  );
}

/**
 * StatusBadge - Status indicator with icon
 * 
 * @param {string} status - 'available' | 'unavailable' | 'pending' | 'confirmed' | 'completed'
 */
export function StatusBadge({ status }) {
  const statusConfig = {
    available: { text: "Available", variant: "success", icon: "✓" },
    unavailable: { text: "Unavailable", variant: "error", icon: "✕" },
    pending: { text: "Pending", variant: "warning", icon: "⏳" },
    confirmed: { text: "Confirmed", variant: "success", icon: "✓" },
    completed: { text: "Completed", variant: "info", icon: "✓" },
  };

  const config = statusConfig[status] || statusConfig.unavailable;

  return (
    <Badge variant={config.variant} size="sm" text={`${config.icon} ${config.text}`} />
  );
}
