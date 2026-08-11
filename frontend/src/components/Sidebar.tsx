import React from 'react';
import { UserCheck, ShieldAlert, HelpCircle, Users, CheckCircle2, Building2 } from 'lucide-react';

export type ModuleType = 'b1-customer360' | 'b2-kyc' | 'b3-faq' | 'b4-lookalike';

interface SidebarProps {
  activeModule: ModuleType;
  onSelectModule: (module: ModuleType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onSelectModule }) => {
  const modules = [
    {
      id: 'b1-customer360' as ModuleType,
      title: 'B1: SBI Customer 360°',
      subtitle: 'Core Banking Profile & Financial KPIs',
      icon: UserCheck,
      badge: 'Operational',
    },
    {
      id: 'b2-kyc' as ModuleType,
      title: 'B2: SBI e-KYC Compliance',
      subtitle: 'Regulatory Rules & Verification',
      icon: ShieldAlert,
      badge: 'Operational',
    },
    {
      id: 'b3-faq' as ModuleType,
      title: 'B3: SBI YONO AI Assistant',
      subtitle: 'Context RAG & Ollama Local LLM',
      icon: HelpCircle,
      badge: 'Operational',
    },
    {
      id: 'b4-lookalike' as ModuleType,
      title: 'B4: SBI Lookalike Risk',
      subtitle: 'Portfolio Similarity & Caution',
      icon: Users,
      badge: 'Operational',
    },
  ];

  return (
    <aside className="w-72 bg-[#0A192F]/80 border-r border-[#00A3E0]/20 p-4 flex flex-col justify-between shrink-0 font-sans">
      <div className="space-y-4">
        {/* SBI Navigation Header */}
        <div className="px-3 py-2 flex items-center space-x-2 border-b border-gray-800">
          <Building2 className="w-4 h-4 text-[#00A3E0]" />
          <span className="text-xs font-mono font-bold text-[#00A3E0] tracking-wider uppercase">
            SBI ASSISTANT MODULES
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
                    ? 'bg-[#003366]/80 text-white border-[#00A3E0] shadow-lg shadow-[#003366]/40 sbi-glow'
                    : 'bg-[#020A17]/60 text-gray-300 border-gray-800/80 hover:border-[#00A3E0]/40 hover:bg-[#0A192F]/90'
                }`}
              >
                <div
                  className={`p-2 rounded-xl transition-all shrink-0 ${
                    isActive
                      ? 'bg-[#00A3E0] text-[#0A192F]'
                      : 'bg-[#0A192F] text-[#00A3E0] group-hover:bg-[#003366]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-bold font-mono tracking-tight ${isActive ? 'text-[#00A3E0]' : 'text-gray-100'}`}>
                      {m.title}
                    </h3>
                    <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      <CheckCircle2 className="w-2.5 h-2.5" />
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
      </div>

      {/* SBI Project Status Footer */}
      <div className="p-3.5 rounded-2xl bg-[#020A17] border border-[#00A3E0]/30 space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between text-gray-300">
          <span className="font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00A3E0] animate-ping" />
            Project Status:
          </span>
          <span className="text-[#00A3E0] font-bold">100% Complete</span>
        </div>
        <p className="text-[10px] text-gray-400 leading-tight">
          All SBI Modules (B1, B2, B3, B4) Fully Functional with Grounded Evidence Citations.
        </p>
      </div>
    </aside>
  );
};
