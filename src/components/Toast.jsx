import React, { useEffect, useState } from "react";

/**
 * Toast Component - Displays temporary notifications
 * 
 * Features:
 * - Auto-dismiss after 3 seconds (success/info)
 * - Auto-dismiss after 5 seconds (warning)
 * - Manual dismiss for errors (stays longer)
 * - Smooth animations
 * - Color-coded by type
 * 
 * @param {object} props
 * @param {string} props.message - Toast message
 * @param {string} props.type - 'success' | 'error' | 'warning' | 'info'
 * @param {function} props.onDismiss - Callback when dismissed
 * @param {number} props.duration - Auto-dismiss time in ms (0 = manual only)
 * @param {string} props.id - Unique identifier (for batch toasts)
 */
export default function Toast({
  message,
  type = "info",
  onDismiss,
  duration = 3000,
  id,
}) {
  useEffect(() => {
    if (duration === 0) return; // Manual dismiss only

    const timer = setTimeout(() => {
      onDismiss?.(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onDismiss]);

  const getStyles = () => {
    const baseClasses = "flex items-center gap-3 px-4 py-3 rounded-lg border";

    switch (type) {
      case "success":
        return {
          container: `${baseClasses} bg-green-900/20 border-green-700 text-green-300`,
          icon: "text-green-400",
          iconSymbol: "✓",
        };
      case "error":
        return {
          container: `${baseClasses} bg-red-900/20 border-red-700 text-red-300`,
          icon: "text-red-400",
          iconSymbol: "✕",
        };
      case "warning":
        return {
          container: `${baseClasses} bg-amber-900/20 border-amber-700 text-amber-300`,
          icon: "text-amber-400",
          iconSymbol: "⚠",
        };
      default: // info
        return {
          container: `${baseClasses} bg-blue-900/20 border-blue-700 text-blue-300`,
          icon: "text-blue-400",
          iconSymbol: "ℹ",
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="animate-fade-in">
      <div className={styles.container}>
        <span className={`${styles.icon} text-lg font-bold flex-shrink-0`}>
          {styles.iconSymbol}
        </span>
        <span className="flex-1 text-sm">{message}</span>
        {type === "error" && (
          <button
            onClick={() => onDismiss?.(id)}
            className="text-red-400 hover:text-red-300 transition flex-shrink-0 ml-2"
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * ToastContainer - Manages multiple toasts
 * 
 * Usage:
 * const { toasts, addToast, removeToast } = useToasts();
 * 
 * addToast('Success!', 'success');
 * addToast('Error occurred', 'error', 0); // Manual dismiss
 */
export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info", duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}

/**
 * ToastContainer - Display component for toast stack
 */
export function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md pointer-events-auto">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
