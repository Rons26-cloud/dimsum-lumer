import clsx from "clsx";

const variants = {
  primary: "bg-primary text-white hover:bg-primary-600 active:bg-primary-700",
  outline: "border border-primary text-primary hover:bg-primary-50",
  ghost: "text-dark hover:bg-gray-100",
};

export default function Button({
  children,
  variant = "primary",
  type = "button",
  className,
  ...props
}) {
  return (
    <button
      type={type}
      className={clsx(
        "px-5 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        variants[variant] || variants.primary,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}