import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  colorClass?: string;
  alert?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  colorClass = "bg-blue-600",
  alert = false
}) => {
  return (
    <div className={`bg-white dark:bg-slate-800 p-5 rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md ${alert ? 'border-red-200 dark:border-red-900/50 ring-1 ring-red-100 dark:ring-red-900/30' : 'border-slate-200 dark:border-slate-700'}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
          <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
        </div>
      </div>
      {trend && (
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {trend}
        </div>
      )}
    </div>
  );
};