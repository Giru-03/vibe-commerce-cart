import { FiLoader } from 'react-icons/fi';

export function MiniSpinner({ size = "sm", className = "" }) {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4", 
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <FiLoader className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
}

// Button Loading Component
export function ButtonSpinner({ size = "sm", className = "" }) {
  return (
    <div className="flex items-center justify-center">
      <MiniSpinner size={size} className={className} />
    </div>
  );
}

// Inline text loading
export function InlineLoader({ text = "Loading...", size = "xs" }) {
  return (
    <div className="flex items-center gap-2 text-gray-500">
      <MiniSpinner size={size} />
      <span className="text-sm">{text}</span>
    </div>
  );
}
