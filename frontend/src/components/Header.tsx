import React from 'react';
import { FileText, ShieldCheck, Landmark, ChevronDown, Sparkles, LogOut } from 'lucide-react';
import type { CustomerBasicInfo, AuthUser } from '../types';

interface HeaderProps {
  customers: CustomerBasicInfo[];
  selectedCustomerId: number | null;
  onSelectCustomer: (id: number) => void;
  onToggleEvidence: () => void;
  showEvidence: boolean;
  citationCount: number;
  user?: AuthUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onToggleEvidence,
  showEvidence,
  citationCount,
  user,
  onLogout,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xl backdrop-blur-md">
      {/* 1. Brand Logo & Title Header */}
      <div className="flex items-center space-x-3.5">
        <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl text-white shadow-lg shadow-blue-500/30 flex items-center justify-center">
          <Landmark className="w-6 h-6" />
        </div>

        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-display font-black tracking-tight text-white flex items-center gap-2">
              ITSS <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">BANK</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 tracking-wider uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-400" /> Commercial Banking
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Official Core Banking Intelligence Platform • Verified Customer Records
          </p>
        </div>
      </div>

      {/* 2. Customer Switcher, User Profile & Controls */}
      <div className="flex items-center space-x-3.5">
        {/* Customer Select Dropdown */}
        <div className="relative min-w-[260px]">
          <select
            value={selectedCustomerId || ''}
            onChange={(e) => onSelectCustomer(Number(e.target.value))}
            className="w-full bg-slate-800/90 border border-slate-700 hover:border-blue-500/50 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500 cursor-pointer shadow-inner pr-8 font-semibold transition-all appearance-none"
          >
            {customers.map((c) => (
              <option key={c.customer_id} value={c.customer_id} className="bg-slate-900 text-white">
                #{c.customer_id} — {c.name_1} ({c.kyc_status})
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-blue-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>

        {/* Verified Bank Records Pill */}
        <div className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">Verified Bank Records</span>
        </div>

        {/* Record Evidence Drawer Button */}
        <button
          onClick={onToggleEvidence}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all border shadow-lg ${
            showEvidence
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-blue-500/30'
              : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white hover:border-slate-600'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-400" />
          <span>Citations</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            showEvidence ? 'bg-white text-blue-700' : 'bg-slate-900 text-blue-400 border border-slate-700'
          }`}>
            {citationCount}
          </span>
        </button>

        {/* User Profile Pill & Logout Button */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="flex items-center gap-2.5 bg-slate-800/90 border border-slate-700/90 rounded-xl px-3 py-1.5">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-7 h-7 rounded-lg object-cover border border-blue-500/40" />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs font-mono">
                  {user.full_name.charAt(0)}
                </div>
              )}
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-white leading-none font-mono">{user.full_name}</div>
                <div className="text-[10px] text-blue-400 font-mono mt-0.5 leading-none">{user.role}</div>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
