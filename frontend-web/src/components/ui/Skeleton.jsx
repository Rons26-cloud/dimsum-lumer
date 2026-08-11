
export default function Skeleton({ className = "h-4 w-full", ...props }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-xl ${className}`.trim()}
      {...props}
    />
  );
}