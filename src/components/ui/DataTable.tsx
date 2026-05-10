import React from "react";
import { cn } from "../utils/cn";

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
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-slate-900/50 text-slate-400 border-b border-border">
          <tr>
            {columns.map((column, i) => (
              <th key={i} className={cn("px-6 py-4 font-semibold", column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.length > 0 ? (
            data.map((item, i) => (
              <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                {columns.map((column, j) => (
                  <td key={j} className={cn("px-6 py-4", column.className)}>
                    {typeof column.accessor === "function" 
                      ? column.accessor(item) 
                      : (item[column.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500 italic">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
