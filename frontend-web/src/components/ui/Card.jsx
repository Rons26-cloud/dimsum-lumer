export default function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}