import React from 'react';
import { ShieldCheck, Search, Database, FileText } from 'lucide-react';
import type { CustomerBasicInfo } from '../types';

interface HeaderProps {
  customers: CustomerBasicInfo[];
  selectedCustomerId: number | null;
  onSelectCustomer: (id: number) => void;
  onToggleEvidence: () => void;
  showEvidence: boolean;
  citationCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onToggleEvidence,
  showEvidence,
  citationCount
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0B0F19]/90 backdrop-blur-md border-b border-gray-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Title / Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">
              Banking Intelligence Assistant
            </h1>
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-2 py-0.5 rounded-full font-mono font-medium">
              v1.0 (20% Foundation)
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Grounding AI responses in deterministic DuckDB banking data records
          </p>
        </div>
      </div>

      {/* Customer Quick Selector & Controls */}
      <div className="flex items-center gap-3">
        {/* Customer Select Dropdown */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
          <select
            value={selectedCustomerId || ''}
            onChange={(e) => onSelectCustomer(Number(e.target.value))}
            className="pl-9 pr-8 py-2 bg-gray-900/90 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer min-w-[240px]"
          >
            <option value="" disabled>Select Customer...</option>
            {customers.map((c) => (
              <option key={c.customer_id} value={c.customer_id}>
                {c.customer_id} — {c.name_1} ({c.kyc_status})
              </option>
            ))}
          </select>
        </div>

        {/* Database Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-mono">
          <Database className="w-3.5 h-3.5" />
          <span>DuckDB Engine Active</span>
        </div>

        {/* Citation Evidence Button */}
        <button
          onClick={onToggleEvidence}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            showEvidence
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
              : 'bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Record Evidence</span>
          {citationCount > 0 && (
            <span className="bg-blue-900 text-blue-200 font-mono text-[10px] px-1.5 py-0.2 rounded-full border border-blue-400/30">
              {citationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
