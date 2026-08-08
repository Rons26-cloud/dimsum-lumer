export default function Loading({ fullscreen = false }) {
  return (
    <div className={fullscreen ? "min-h-dvh flex items-center justify-center" : "flex items-center justify-center py-10"}>
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
