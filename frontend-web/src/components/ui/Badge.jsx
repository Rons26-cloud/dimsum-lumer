export default function Badge({ children, color = "primary", className = "", ...props }) {
  const map = {
    primary: "bg-primary-50 text-primary-600",
    success: "bg-green-50 text-green-600",
    warning: "bg-amber-50 text-amber-600",
    gray: "bg-gray-100 text-gray-600",
  };

  const colorClass = map[color] || map.primary;

  return (
    <span 
      className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${colorClass} ${className}`} 
      {...props}
    >
      {children}
    </span>
  );
}