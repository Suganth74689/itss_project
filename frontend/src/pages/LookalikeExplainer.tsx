import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, AlertTriangle, CheckCircle2, FileText, 
  ArrowRight, ShieldAlert, Sparkles, User, Building2
} from 'lucide-react';
import type { LookalikeResponse, LookalikeMatchItem } from '../types';
import { fetchCustomerLookalikes } from '../api';

interface LookalikeExplainerProps {
  customerId: number | null;
  onOpenEvidence: () => void;
  onSelectCustomer: (id: number) => void;
}

export const LookalikeExplainer: React.FC<LookalikeExplainerProps> = ({ customerId, onOpenEvidence, onSelectCustomer }) => {
  const [data, setData] = useState<LookalikeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<LookalikeMatchItem | null>(null);

  const loadLookalikes = useCallback(async (cid: number) => {
    try {
      setError(null);
      const res = await fetchCustomerLookalikes(cid, 5);
      setData(res);
      if (res.lookalikes.length > 0) {
        setSelectedMatch(res.lookalikes[0]);
      }
    } catch (err: any) {
      setError(err.message || `Failed to calculate SBI lookalikes for Customer #${cid}`);
    }
  }, []);

  useEffect(() => {
    if (customerId) {
      loadLookalikes(customerId);
    }
  }, [customerId, loadLookalikes]);

  if (!customerId) {
    return (
      <div className="glass-panel-sbi p-12 rounded-2xl text-center space-y-3 font-mono">
        <Building2 className="w-12 h-12 text-[#00A3E0] mx-auto opacity-50" />
        <p className="text-gray-400 text-sm">Please select an SBI customer from the top menu bar to view lookalike portfolio risk analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. State Bank of India Lookalike Portfolio Header Banner */}
      <div className="glass-panel-sbi p-6 rounded-2xl relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-[#003366] rounded-2xl text-[#00A3E0] border border-[#00A3E0]/30 shadow-lg">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-white tracking-tight">SBI Lookalike Portfolio Risk Engine</h2>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#003366] text-[#00A3E0] border border-[#00A3E0]/40">
                  Target Customer #{customerId} ({data?.target_customer_name || 'Loading...'})
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1 font-mono">
                Multi-Vector Cosine Similarity • Explainable "Why Similar" & Caution Risk Mismatches
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onOpenEvidence}
              className="flex items-center space-x-2 px-4 py-2 bg-[#003366] hover:bg-[#003366]/80 text-[#00A3E0] border border-[#00A3E0]/40 rounded-xl text-xs font-mono font-bold transition-all shadow-md"
            >
              <FileText className="w-4 h-4 text-[#00A3E0]" />
              <span>Evidence Drawer ({data?.citations?.length || 0})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Lookalike Matches Grid & Detail View */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top 5 Lookalike Cards List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-mono font-bold text-gray-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#00A3E0]" />
                Top 5 Similar SBI Customers:
              </span>
              <span className="text-[11px] text-gray-500 font-mono">Ranked by Vector Score</span>
            </div>

            <div className="space-y-2.5">
              {data.lookalikes.map((item: LookalikeMatchItem) => {
                const isSelected = selectedMatch?.customer_id === item.customer_id;
                return (
                  <div
                    key={item.customer_id}
                    onClick={() => setSelectedMatch(item)}
                    className={`p-4 rounded-2xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#003366]/80 text-white border-[#00A3E0] shadow-lg shadow-[#003366]/30 sbi-glow'
                        : 'bg-[#020A17]/60 text-gray-300 border-gray-800 hover:border-[#00A3E0]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#003366] text-[#00A3E0] flex items-center justify-center font-bold text-xs font-mono border border-[#00A3E0]/30">
                          #{item.customer_id}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-white">{item.name_1}</h4>
                          <span className="text-[10px] text-gray-400 font-mono">{item.employment_type || 'Unspecified'}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#00A3E0] text-[#0A192F] font-mono font-black text-xs">
                        {item.similarity_pct}% Match
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-gray-800/60 text-[11px] font-mono text-gray-300">
                      <div>Income: <span className="text-white">₹{item.monthly_income.toLocaleString('en-IN')}/mo</span></div>
                      <div>DPD: <span className={item.max_days_past_due > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{item.max_days_past_due} Days</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Match Explainability Drawer */}
          {selectedMatch && (
            <div className="lg:col-span-2 glass-panel-sbi p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-[#003366] rounded-xl text-[#00A3E0] border border-[#00A3E0]/30">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Lookalike Customer Breakdown</h3>
                    <p className="text-xs text-gray-400 font-mono">
                      Comparing Target Customer #{customerId} vs Lookalike #{selectedMatch.customer_id} ({selectedMatch.name_1})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onSelectCustomer(selectedMatch.customer_id)}
                  className="px-3.5 py-2 rounded-xl bg-[#00A3E0] text-[#0A192F] hover:bg-[#0284C7] transition-all text-xs font-mono font-bold flex items-center gap-1.5 shadow-md"
                >
                  <span>Inspect Customer 360</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Financial Metric Comparison Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-[#020A17] border border-gray-800">
                  <span className="text-gray-400 text-[10px] block">Monthly Income</span>
                  <span className="font-bold text-white">₹{selectedMatch.monthly_income.toLocaleString('en-IN')}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#020A17] border border-gray-800">
                  <span className="text-gray-400 text-[10px] block">Working Balance</span>
                  <span className="font-bold text-[#00A3E0]">₹{selectedMatch.total_working_balance.toLocaleString('en-IN')}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#020A17] border border-gray-800">
                  <span className="text-gray-400 text-[10px] block">Loan Outstanding</span>
                  <span className="font-bold text-amber-400">₹{selectedMatch.total_outstanding_loan.toLocaleString('en-IN')}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#020A17] border border-gray-800">
                  <span className="text-gray-400 text-[10px] block">Bureau Credit Score</span>
                  <span className="font-bold text-emerald-400">{selectedMatch.credit_score} Pts</span>
                </div>
              </div>

              {/* Explainable Checklist: Why Similar? */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  Why Similar? (Matching Feature Checklist)
                </h4>
                <div className="space-y-2 text-xs font-mono">
                  {selectedMatch.matching_features.map((mf: string, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#020A17] border border-emerald-500/30 text-emerald-300 flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{mf}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explainable Checklist: Caution / Risk Discrepancies */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5 uppercase">
                  <AlertTriangle className="w-4 h-4" />
                  Caution / Risk Discrepancies Callout
                </h4>
                <div className="space-y-2 text-xs font-mono">
                  {selectedMatch.risk_discrepancies.map((rd: string, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#020A17] border border-amber-500/30 text-amber-300 flex items-start gap-2">
                      <span>{rd}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
