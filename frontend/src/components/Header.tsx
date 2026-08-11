import React from 'react';
import { FileText, Database, ShieldCheck, Layers, ChevronDown } from 'lucide-react';
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
  citationCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* 1. Brand Logo & Header */}
      <div className="flex items-center space-x-3.5">
        <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
          <Layers className="w-6 h-6" />
        </div>

        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 font-sans flex items-center gap-2">
              NEXUS <span className="text-blue-600">BANKING AI</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 tracking-wider">
              ENTERPRISE PLATFORM
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Grounding AI responses in deterministic DuckDB core banking records
          </p>
        </div>
      </div>

      {/* 2. Customer Switcher & Controls */}
      <div className="flex items-center space-x-4">
        {/* Customer Select Dropdown */}
        <div className="relative min-w-[280px]">
          <select
            value={selectedCustomerId || ''}
            onChange={(e) => onSelectCustomer(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer shadow-sm pr-8 font-semibold"
          >
            {customers.map((c) => (
              <option key={c.customer_id} value={c.customer_id}>
                #{c.customer_id} — {c.name_1} ({c.kyc_status})
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
        </div>

        {/* DuckDB Database Active Pill */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
          <Database className="w-4 h-4 text-blue-600" />
          <span className="font-semibold">DuckDB Engine Active</span>
        </div>

        {/* Record Evidence Drawer Button */}
        <button
          onClick={onToggleEvidence}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all border shadow-sm ${
            showEvidence
              ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Record Evidence</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            showEvidence ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}>
            {citationCount}
          </span>
        </button>
      </div>
    </header>
  );
};
