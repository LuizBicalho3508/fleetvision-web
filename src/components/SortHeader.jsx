import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export default function SortHeader({ label, sortKey, currentSort, onSort, className = "" }) {
  return (
    <th 
      className={`p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors select-none ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {currentSort.key === sortKey ? (
          currentSort.direction === 'asc' ? <ArrowUp size={14} className="text-blue-500"/> : <ArrowDown size={14} className="text-blue-500"/>
        ) : (
          <ArrowUpDown size={14} className="text-slate-400 opacity-50"/>
        )}
      </div>
    </th>
  );
}
