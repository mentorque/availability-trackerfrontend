import { Spinner } from "./LoadingSkeleton";

/**
 * Button - Reusable button with states and loading indicator
 * 
 * @param {ReactNode} children - Button content
 * @param {string} variant - 'primary' | 'secondary' | 'danger' | 'ghost'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} loading - Show loading state with spinner
 * @param {boolean} disabled - Disable the button
 * @param {string} className - Additional classes
 * @param {string} loadingText - Text to show while loading
 * @param {object} ...props - Other button props
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  loadingText = "Loading...",
  ...props
}) {
  const baseClasses = "font-semibold rounded-lg transition-smooth inline-flex items-center justify-center gap-2 focus-ring";

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    danger: "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20",
    ghost: "bg-transparent hover:bg-slate-800/50 text-slate-300 border border-slate-700",
  };

  const sizeClasses = {
    sm: "text-sm px-3 py-1.5 h-9",
    md: "text-sm px-4 py-2.5 h-10",
    lg: "text-base px-6 py-3 h-12",
  };

  const disabledClasses = "opacity-50 cursor-not-allowed hover:none";

  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        isDisabled ? disabledClasses : ""
      } ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" inline />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
