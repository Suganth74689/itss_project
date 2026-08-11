import React from 'react';
import { UserCheck, ShieldAlert, HelpCircle, Users, LayoutDashboard } from 'lucide-react';

export type ModuleType = 'b1-customer360' | 'b2-kyc' | 'b3-faq' | 'b4-lookalike';

interface SidebarProps {
  activeModule: ModuleType;
  onSelectModule: (mod: ModuleType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onSelectModule }) => {
  const navItems = [
    {
      id: 'b1-customer360' as ModuleType,
      label: 'B1 — Customer 360',
      desc: 'Complete Q&A & financial summary',
      icon: LayoutDashboard,
      badge: 'Operational',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'b2-kyc' as ModuleType,
      label: 'B2 — KYC Completeness',
      desc: 'Configurable compliance engine',
      icon: UserCheck,
      badge: 'Operational',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'b3-faq' as ModuleType,
      label: 'B3 — Bank FAQ Assistant',
      desc: 'Restricted knowledge RAG',
      icon: HelpCircle,
      badge: 'Operational',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'b4-lookalike' as ModuleType,
      label: 'B4 — Lookalike Explainer',
      desc: 'Weighted customer similarity ML',
      icon: Users,
      badge: 'Phase 3',
      badgeColor: 'bg-gray-800 text-gray-400 border-gray-700'
    }
  ];

  return (
    <aside className="w-64 bg-[#0B0F19] border-r border-gray-800 flex flex-col justify-between shrink-0 p-4 min-h-[calc(100vh-73px)]">
      <div className="space-y-6">
        <div className="px-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Banking Modules
          </p>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeModule === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectModule(item.id)}
                className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1 border ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500/40 text-blue-300 shadow-md shadow-blue-900/20'
                    : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-900 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 pl-6 leading-tight">
                  {item.desc}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Dataset Summary Footer */}
      <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 space-y-2 text-xs">
        <div className="flex items-center justify-between text-gray-400">
          <span className="font-semibold text-gray-300">Dataset Scope</span>
          <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-gray-400">
          <div>Customers: <span className="text-white">120</span></div>
          <div>Accounts: <span className="text-white">228</span></div>
          <div>Loans: <span className="text-white">160</span></div>
          <div>Txns: <span className="text-white">650</span></div>
          <div>Apps: <span className="text-white">180</span></div>
          <div>Limits: <span className="text-white">100</span></div>
        </div>
      </div>
    </aside>
  );
};
