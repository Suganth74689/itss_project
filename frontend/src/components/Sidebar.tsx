import React from 'react';
import { UserCheck, ShieldAlert, HelpCircle, Users, CheckCircle2, Landmark } from 'lucide-react';

export type ModuleType = 'b1-customer360' | 'b2-kyc' | 'b3-faq' | 'b4-lookalike';

interface SidebarProps {
  activeModule: ModuleType;
  onSelectModule: (module: ModuleType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onSelectModule }) => {
  const modules = [
    {
      id: 'b1-customer360' as ModuleType,
      title: 'Customer 360° Profile',
      subtitle: 'Unified Account & Financial Overview',
      icon: UserCheck,
    },
    {
      id: 'b2-kyc' as ModuleType,
      title: 'e-KYC & Compliance',
      subtitle: 'Regulatory Identity Verification',
      icon: ShieldAlert,
    },
    {
      id: 'b3-faq' as ModuleType,
      title: 'ITSS Virtual Assistant',
      subtitle: '24/7 Smart Banking Support',
      icon: HelpCircle,
    },
    {
      id: 'b4-lookalike' as ModuleType,
      title: 'Portfolio Risk Analytics',
      subtitle: 'Peer Similarity & Credit Insights',
      icon: Users,
    },
  ];

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between shrink-0 font-sans shadow-xl">
      <div className="space-y-4">
        {/* Navigation Header */}
        <div className="px-3 py-2 flex items-center space-x-2 border-b border-slate-800">
          <Landmark className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase">
            ITSS BANKING SERVICES
          </span>
        </div>

        {/* Navigation Item Cards */}
        <nav className="space-y-2.5">
          {modules.map((m) => {
            const Icon = m.icon;
            const isActive = activeModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelectModule(m.id)}
                className={`w-full text-left p-3.5 rounded-2xl transition-all relative group flex items-start space-x-3 border ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-lg shadow-blue-500/25'
                    : 'bg-slate-800/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div
                  className={`p-2 rounded-xl transition-all shrink-0 ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'bg-slate-800 text-blue-400 border border-slate-700 group-hover:border-blue-500/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-bold font-mono tracking-tight ${isActive ? 'text-white' : 'text-slate-200'}`}>
                      {m.title}
                    </h3>
                    <span className={`flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      isActive ? 'bg-white/20 text-white border-white/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 line-clamp-1 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                    {m.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Project Status Footer */}
      <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-800 space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between text-slate-300">
          <span className="font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            System Status:
          </span>
          <span className="text-emerald-400 font-bold">ITSS Online</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          All ITSS Commercial Banking services and compliance systems fully operational.
        </p>
      </div>
    </aside>
  );
};
