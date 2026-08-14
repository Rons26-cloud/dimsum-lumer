
export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="w-full mb-4">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-xs ${
          error 
            ? 'border-red-500 focus:ring-red-500/50 text-red-900 placeholder-red-300' 
            : 'border-gray-200 focus:border-primary text-dark placeholder-gray-400'
        } ${className}`.trim()}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  )
}
