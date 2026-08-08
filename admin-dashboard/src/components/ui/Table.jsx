export default function Table({ columns, data, renderRow }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-100">
            {columns.map((c) => <th key={c} className="pb-2 font-medium">{c}</th>)}
          </tr>
        </thead>
        <tbody>{data.map((row, i) => renderRow(row, i))}</tbody>
      </table>
    </div>
  );
}
