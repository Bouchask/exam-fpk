import { cn } from "../../utils/cn";

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export function DataTable<T>({ columns, data, emptyMessage = "No data available." }: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto border border-app-border bg-white rounded-none">
      <table className="w-full text-sm text-left">
        <thead className="text-[10px] uppercase tracking-[0.2em] bg-app-fg text-stone-300">
          <tr>
            {columns.map((column, i) => (
              <th key={i} className={cn("px-6 py-5 font-black border-r border-stone-800 last:border-r-0", column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 text-app-fg font-medium">
          {data.length > 0 ? (
            data.map((item, i) => (
              <tr key={i} className="hover:bg-stone-50 transition-colors duration-100">
                {columns.map((column, j) => (
                  <td key={j} className={cn("px-6 py-4 border-r border-stone-50 last:border-r-0", column.className)}>
                    {typeof column.accessor === "function" 
                      ? column.accessor(item) 
                      : (item[column.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-20 text-center text-stone-400 uppercase text-[10px] font-black tracking-widest italic">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
