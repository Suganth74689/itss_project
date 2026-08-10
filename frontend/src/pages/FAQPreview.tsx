import React from 'react';
import { HelpCircle, Lock } from 'lucide-react';

export const FAQPreview: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">B3 — Bank FAQ Assistant</h2>
              <p className="text-xs text-gray-400">Restricted Knowledge RAG & Guardrailed QA (Phase 2 Preview)</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs rounded-full font-mono">
            Phase 2 Ready
          </span>
        </div>

        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 space-y-3 text-xs">
          <div className="flex items-center gap-2 text-blue-300 font-semibold">
            <Lock className="w-4 h-4 text-blue-400" />
            <span>Strict Guardrail Architecture</span>
          </div>
          <p className="text-gray-400 leading-relaxed">
            The Bank FAQ Assistant module strictly enforces out-of-scope refusals. Non-banking prompts or general programming/trivia queries will be politely rejected, ensuring maximum safety and regulatory compliance.
          </p>
        </div>
      </div>
    </div>
  );
};
