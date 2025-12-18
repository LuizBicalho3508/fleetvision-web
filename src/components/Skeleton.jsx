import React from 'react';

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="animate-pulse">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-4 border-b border-slate-100 dark:border-slate-700">
        {[...Array(cols)].map((_, j) => (
          <div key={j} className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-32 animate-pulse flex justify-between items-center">
    <div className="space-y-3 w-1/2">
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
    </div>
    <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
  </div>
);
