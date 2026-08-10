import React from 'react';
import { Users, Sparkles } from 'lucide-react';
import type { Customer360Response } from '../types';

interface LookalikePreviewProps {
  data: Customer360Response | null;
}

export const LookalikePreview: React.FC<LookalikePreviewProps> = ({ data }) => {
  const customer = data?.customer;

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">B4 — Lookalike Customer Explainer</h2>
              <p className="text-xs text-gray-400">Weighted feature similarity & risk explainability engine (Phase 2 Preview)</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs rounded-full font-mono">
            Phase 2 Ready
          </span>
        </div>

        {customer ? (
          <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Target Customer: {customer.name_1} ({customer.customer_id})</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              In Phase 2, this module will compute feature vector similarity across income, credit score, loan exposure, limit utilization, and transaction velocity using scikit-learn cosine & weighted metrics.
            </p>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500 text-xs">Select a customer above to calculate lookalike profiles.</div>
        )}
      </div>
    </div>
  );
};
