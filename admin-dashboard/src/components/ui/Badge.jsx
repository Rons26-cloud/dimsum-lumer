const map = {
  pending: "bg-amber-50 text-amber-600",
  processing: "bg-blue-50 text-blue-600",
  shipping: "bg-purple-50 text-purple-600",
  completed: "bg-green-50 text-green-600",
  cancelled: "bg-red-50 text-red-600",
};
export default function Badge({ status, children }) {
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${map[status] ?? "bg-gray-100 text-gray-600"}`}>{children}</span>;
}
