import React from 'react';
import { FileText, Database, ShieldCheck } from 'lucide-react';
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
    <header className="bg-[#0A192F]/90 border-b border-[#00A3E0]/30 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md shadow-lg shadow-[#003366]/20">
      {/* 1. Official State Bank of India Logo & Brand Header */}
      <div className="flex items-center space-x-3.5">
        {/* Iconic SBI Keyhole SVG Emblem */}
        <div className="relative group cursor-pointer">
          <svg viewBox="0 0 100 100" className="w-10 h-10 drop-shadow-[0_0_10px_rgba(0,163,224,0.5)] transition-transform group-hover:scale-105">
            <circle cx="50" cy="50" r="48" fill="#00A3E0" />
            <circle cx="50" cy="38" r="17" fill="#0A192F" />
            <rect x="43.5" y="38" width="13" height="34" fill="#0A192F" />
          </svg>
        </div>

        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black tracking-tight text-white font-sans flex items-center gap-2">
              <span className="text-[#00A3E0]">STATE BANK</span> OF INDIA
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#003366] text-[#00A3E0] border border-[#00A3E0]/40 tracking-wider">
              YONO AI PLATFORM
            </span>
          </div>
          <p className="text-[11px] text-gray-300 font-mono flex items-center gap-1.5 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00A3E0]" />
            Grounding AI responses in deterministic DuckDB core banking data records
          </p>
        </div>
      </div>

      {/* 2. Customer Switcher & SBI Engine Status */}
      <div className="flex items-center space-x-4">
        {/* Customer Select Dropdown */}
        <div className="relative min-w-[280px]">
          <select
            value={selectedCustomerId || ''}
            onChange={(e) => onSelectCustomer(Number(e.target.value))}
            className="w-full bg-[#020A17] border border-[#00A3E0]/40 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00A3E0] cursor-pointer shadow-inner appearance-none pr-8 font-medium"
          >
            {customers.map((c) => (
              <option key={c.customer_id} value={c.customer_id}>
                {c.customer_id} — {c.name_1} ({c.kyc_status})
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-2.5 pointer-events-none text-[#00A3E0] text-xs">
            ▼
          </div>
        </div>

        {/* DuckDB Database Active Pill */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#003366]/40 border border-[#00A3E0]/30 text-xs font-mono text-cyan-300">
          <Database className="w-4 h-4 text-[#00A3E0] animate-pulse" />
          <span>DuckDB Engine Active</span>
        </div>

        {/* Record Evidence Drawer Button */}
        <button
          onClick={onToggleEvidence}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all border shadow-md ${
            showEvidence
              ? 'bg-[#00A3E0] text-[#0A192F] border-[#00A3E0] shadow-[#00A3E0]/30'
              : 'bg-[#0A192F] text-gray-200 border-[#00A3E0]/40 hover:bg-[#003366]/60 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 text-[#00A3E0]" />
          <span>Record Evidence</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#003366] text-[#00A3E0] border border-[#00A3E0]/40">
            {citationCount}
          </span>
        </button>
      </div>
    </header>
  );
};
