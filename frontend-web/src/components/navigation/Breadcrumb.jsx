import { Link } from "react-router-dom";

export default function Breadcrumb({ items = [] }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {item.to ? <Link to={item.to} className="hover:text-primary">{item.label}</Link> : <span className="text-dark">{item.label}</span>}
          {i < items.length - 1 && <span>/</span>}
        </span>
      ))}
    </div>
  );
}
