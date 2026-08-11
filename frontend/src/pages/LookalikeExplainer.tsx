import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, CheckCircle2, FileText, RefreshCw, ChevronRight, ShieldAlert, Sparkles, Scale } from 'lucide-react';
import type { LookalikeResponse, LookalikeMatchItem } from '../types';
import { fetchCustomerLookalikes } from '../api';

interface LookalikeExplainerProps {
  customerId: number | null;
  onOpenEvidence: () => void;
  onSelectCustomer: (id: number) => void;
}

export const LookalikeExplainer: React.FC<LookalikeExplainerProps> = ({ customerId, onOpenEvidence, onSelectCustomer }) => {
  const [data, setData] = useState<LookalikeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    loadLookalikes();
  }, [customerId]);

  async function loadLookalikes() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchCustomerLookalikes(customerId!);
      setData(res);
    } catch (err: any) {
      setError(`Failed to calculate lookalikes for Customer #${customerId}`);
    } finally {
      setLoading(false);
    }
  }

  if (!customerId) {
    return (
      <div className="py-12 text-center text-gray-500 text-sm glass-panel rounded-2xl">
        Select a customer above to calculate lookalike similarity profile.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="text-sm text-gray-400 font-mono">Computing multi-vector similarity & risk discrepancies for Customer #{customerId}...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <span>{error || 'Unable to compute lookalikes.'}</span>
        </div>
      </div>
    );
  }

  const { target_customer_id, target_customer_name, lookalikes, citations } = data;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-white tracking-tight">{target_customer_name}</h2>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Target ID: {target_customer_id}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 font-mono">
                Multi-Vector Feature Similarity Engine • Weighted MinMax Vector Normalization
              </p>
            </div>
          </div>

          <button
            onClick={onOpenEvidence}
            className="flex items-center gap-2 px-3.5 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl text-gray-300 text-xs font-semibold transition-all shrink-0"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Citations ({citations.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Top Lookalike Customer Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            Top {lookalikes.length} Most Similar Lookalike Customers
          </h3>
          <span className="text-xs text-gray-400 font-mono">Sorted by Cosine Vector Match %</span>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {lookalikes.map((match: LookalikeMatchItem, rank: number) => (
            <div key={match.customer_id} className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-5 hover:border-gray-700 transition-all">
              {/* Card Top Row */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-800/80 pb-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-sm text-indigo-300 font-mono">
                    #{rank + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-lg font-bold text-white">{match.name_1}</h4>
                      <span className="text-xs font-mono text-gray-400 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded">
                        ID: {match.customer_id}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">
                      Income: ₹{match.monthly_income.toLocaleString('en-IN')} • {match.employment_type} • Credit Score: {match.credit_score}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Similarity Badge Gauge */}
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block font-mono">Similarity Score</span>
                    <span className="text-2xl font-bold font-mono text-emerald-400">{match.similarity_pct}%</span>
                  </div>

                  <button
                    onClick={() => onSelectCustomer(match.customer_id)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all"
                  >
                    <span>Inspect 360</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Financial Metrics Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800/80 space-y-1">
                  <span className="text-gray-400 text-[11px]">Working Balance</span>
                  <p className="text-white font-bold">₹{match.total_working_balance.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800/80 space-y-1">
                  <span className="text-gray-400 text-[11px]">Loan Exposure</span>
                  <p className="text-blue-300 font-bold">₹{match.total_outstanding_loan.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800/80 space-y-1">
                  <span className="text-gray-400 text-[11px]">Max DPD Overdue</span>
                  <p className={`font-bold ${match.max_days_past_due > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {match.max_days_past_due} Days
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800/80 space-y-1">
                  <span className="text-gray-400 text-[11px]">Suspicious Alerts</span>
                  <p className={`font-bold ${match.suspicious_txn_count > 0 ? 'text-rose-400' : 'text-gray-300'}`}>
                    {match.suspicious_txn_count} Flag(s)
                  </p>
                </div>
              </div>

              {/* Explainability Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Why Similar Checklist */}
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
                  <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Why Similar? (Matching Features)</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-200">
                    {match.matching_features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold shrink-0">✓</span>
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Caution / Risk Discrepancies */}
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2.5">
                  <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Caution / Risk Discrepancies</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-200">
                    {match.risk_discrepancies.map((risk, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="leading-snug">{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
