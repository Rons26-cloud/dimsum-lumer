export default function Card({ title, action, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="font-semibold text-gray-800">{title}</h3>}
          {action && <div className="text-xs font-semibold text-primary">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
