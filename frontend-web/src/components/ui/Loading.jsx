import { Loader2 } from "lucide-react";

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 36,
  xl: 48,
};


export default function Loading({ 
  fullscreen = false, 
  size = "md", 
  text = "", 
  className = "" 
}) {
  const iconSize = typeof size === "number" ? size : (sizeMap[size] || sizeMap.md);

  return (
    <div
      className={
        fullscreen
          ? `min-h-dvh flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs z-50 ${className}`.trim()
          : `flex flex-col items-center justify-center py-10 px-4 ${className}`.trim()
      }
    >
      <Loader2 size={iconSize} className="text-primary animate-spin" strokeWidth={2.5} />
      {text && (
        <p className="text-xs text-gray-500 font-medium mt-3 tracking-wide animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}