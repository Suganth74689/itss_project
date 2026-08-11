import React from 'react';
import { UserCheck, ShieldAlert, HelpCircle, Users, CheckCircle2, LayoutGrid } from 'lucide-react';

export type ModuleType = 'b1-customer360' | 'b2-kyc' | 'b3-faq' | 'b4-lookalike';

interface SidebarProps {
  activeModule: ModuleType;
  onSelectModule: (module: ModuleType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onSelectModule }) => {
  const modules = [
    {
      id: 'b1-customer360' as ModuleType,
      title: 'B1: Customer 360° Profile',
      subtitle: 'Financial KPIs & Accounts Data',
      icon: UserCheck,
    },
    {
      id: 'b2-kyc' as ModuleType,
      title: 'B2: e-KYC Compliance',
      subtitle: 'Regulatory Rules & Verification',
      icon: ShieldAlert,
    },
    {
      id: 'b3-faq' as ModuleType,
      title: 'B3: Nexus RAG AI Assistant',
      subtitle: 'Context RAG & Ollama LLM',
      icon: HelpCircle,
    },
    {
      id: 'b4-lookalike' as ModuleType,
      title: 'B4: Lookalike Risk Portfolio',
      subtitle: 'Portfolio Similarity & Risk',
      icon: Users,
    },
  ];

  return (
    <aside className="w-72 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 font-sans shadow-sm">
      <div className="space-y-4">
        {/* Navigation Header */}
        <div className="px-3 py-2 flex items-center space-x-2 border-b border-slate-200">
          <LayoutGrid className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-mono font-bold text-slate-800 tracking-wider uppercase">
            NEXUS AI MODULES
          </span>
        </div>

        {/* Navigation Item Cards */}
        <nav className="space-y-2">
          {modules.map((m) => {
            const Icon = m.icon;
            const isActive = activeModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelectModule(m.id)}
                className={`w-full text-left p-3.5 rounded-2xl transition-all relative group flex items-start space-x-3 border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                <div
                  className={`p-2 rounded-xl transition-all shrink-0 ${
                    isActive
                      ? 'bg-white text-blue-600'
                      : 'bg-white text-blue-600 border border-slate-200 group-hover:border-blue-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-bold font-mono tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                      {m.title}
                    </h3>
                    <span className={`flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      isActive ? 'bg-blue-700 text-white border-blue-500' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 line-clamp-1 ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                    {m.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Project Status Footer */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between text-slate-700">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            Project Status:
          </span>
          <span className="text-blue-700 font-bold">100% Complete</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          All Modules (B1, B2, B3, B4) Fully Functional with Grounded Evidence Citations.
        </p>
      </div>
    </aside>
  );
};
