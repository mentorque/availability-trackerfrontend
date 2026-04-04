/**
 * LoadingSkeleton - Animated loading placeholder
 * 
 * @param {string} type - 'card' | 'line' | 'circle' | 'button' | 'table'
 * @param {number} count - Number of skeletons to show
 * @param {string} className - Additional classes
 */
export default function LoadingSkeleton({ type = "card", count = 1, className = "" }) {
  const renderSkeleton = () => {
    switch (type) {
      case "line":
        return (
          <div className="skeleton h-4 w-3/4 rounded-lg" />
        );
      case "circle":
        return (
          <div className="skeleton h-10 w-10 rounded-full" />
        );
      case "button":
        return (
          <div className="skeleton h-10 px-4 rounded-lg w-24" />
        );
      case "card":
        return (
          <div className="skeleton rounded-lg p-4 space-y-3">
            <div className="skeleton h-4 w-1/2 rounded-lg" />
            <div className="skeleton h-4 w-3/4 rounded-lg" />
            <div className="skeleton h-8 w-full rounded-lg" />
          </div>
        );
      case "table":
        return (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-12 w-full rounded-lg" />
            ))}
          </div>
        );
      default:
        return <div className="skeleton h-4 w-full rounded-lg" />;
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div key={i}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
}

/**
 * Spinner - Loading indicator with optional text
 * 
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {string} text - Optional text to display
 * @param {boolean} inline - Whether to display inline or block
 */
export function Spinner({ size = "md", text = "", inline = false }) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
  };

  const container = inline ? "flex items-center gap-2" : "flex flex-col items-center gap-3";

  return (
    <div className={container}>
      <div className={`${sizeClasses[size]} rounded-full border-slate-600 border-t-blue-500 animate-spin-smooth`} />
      {text && <p className="text-slate-400 font-medium text-sm">{text}</p>}
    </div>
  );
}
