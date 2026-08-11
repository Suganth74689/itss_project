import React from 'react';
import { UserCheck, HelpCircle, Users, LayoutDashboard } from 'lucide-react';

export type ModuleType = 'b1-customer360' | 'b2-kyc' | 'b3-faq' | 'b4-lookalike';

interface SidebarProps {
  activeModule: ModuleType;
  onSelectModule: (module: ModuleType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onSelectModule }) => {
  const modules = [
    {
      id: 'b1-customer360' as ModuleType,
      title: 'B1: Customer 360 Aggregator',
      subtitle: 'Financial KPIs, Accounts, Loans & Txns',
      icon: LayoutDashboard,
      badge: 'Operational ✅',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'b2-kyc' as ModuleType,
      title: 'B2: KYC Completeness Assistant',
      subtitle: 'Compliance Rules & Document Verification',
      icon: UserCheck,
      badge: 'Operational ✅',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'b3-faq' as ModuleType,
      title: 'B3: Bank FAQ Assistant',
      subtitle: 'Knowledge RAG & Out-of-Scope Guardrails',
      icon: HelpCircle,
      badge: 'Operational ✅',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'b4-lookalike' as ModuleType,
      title: 'B4: Lookalike Customer Explainer',
      subtitle: 'Similarity Matching & Risk Discrepancies',
      icon: Users,
      badge: 'Operational ✅',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    }
  ];

  return (
    <aside className="w-72 bg-gray-900/50 border-r border-gray-800 p-4 flex flex-col space-y-3 shrink-0">
      <div className="px-2 py-1">
        <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
          Assistant Modules
        </h3>
      </div>

      <nav className="space-y-2 flex-1">
        {modules.map((m) => {
          const Icon = m.icon;
          const isActive = activeModule === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelectModule(m.id)}
              className={`w-full text-left p-3.5 rounded-xl transition-all flex items-start space-x-3 border ${
                isActive
                  ? 'bg-blue-600/15 border-blue-500/40 text-white shadow-lg shadow-blue-950/40'
                  : 'bg-gray-900/40 border-gray-800/80 text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
              }`}
            >
              <div className={`p-2 rounded-lg mt-0.5 ${isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold truncate">{m.title}</h4>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${m.badgeColor}`}>
                    {m.badge}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
                  {m.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-3 bg-gray-900/80 border border-gray-800 rounded-xl text-center text-xs text-gray-400 font-mono space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold">
          <span>Project Status: 100% Complete</span>
        </div>
        <p className="text-[10px] text-gray-400">All Modules (B1, B2, B3, B4) Fully Functional</p>
      </div>
    </aside>
  );
};
