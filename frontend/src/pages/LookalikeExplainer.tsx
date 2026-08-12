import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, AlertTriangle, CheckCircle2, FileText, 
  ArrowRight, ShieldAlert, Sparkles, User, Landmark
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
      setError(err.message || `Failed to calculate portfolio matches for Customer #${cid}`);
    }
  }, []);

  useEffect(() => {
    if (customerId) {
      loadLookalikes(customerId);
    }
  }, [customerId, loadLookalikes]);

  if (!customerId) {
    return (
      <div className="card-modern p-12 text-center space-y-3 font-mono">
        <Landmark className="w-12 h-12 text-blue-600 mx-auto opacity-50" />
        <p className="text-slate-500 text-sm">Please select a customer from the top menu bar to view portfolio risk and peer similarity analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* 1. Header Banner */}
      <div className="card-modern p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/25">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">ITSS Portfolio Risk & Similarity Analytics</h2>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Target Customer #{customerId} ({data?.target_customer_name || 'Loading...'})
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-mono">
                Peer Portfolio Benchmark Analysis • Financial Similarity & Credit Risk Insights
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onOpenEvidence}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-mono font-bold transition-all shadow-sm"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Citations ({data?.citations?.length || 0})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Lookalike Matches Grid & Detail View */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top 5 Lookalike Cards List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-mono font-bold text-slate-700 flex items-center gap-1.5 uppercase">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Top Peer Portfolio Matches:
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Benchmark Ranked</span>
            </div>

            <div className="space-y-2.5">
              {data.lookalikes.map((item: LookalikeMatchItem) => {
                const isSelected = selectedMatch?.customer_id === item.customer_id;
                return (
                  <div
                    key={item.customer_id}
                    onClick={() => setSelectedMatch(item)}
                    className={`p-4 rounded-2xl transition-all cursor-pointer border shadow-sm ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-lg shadow-blue-500/25'
                        : 'bg-white text-slate-900 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-xl font-mono font-bold text-xs flex items-center justify-center border ${
                          isSelected ? 'bg-white text-blue-600 border-white' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          #{item.customer_id}
                        </div>
                        <div>
                          <h4 className={`font-extrabold text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>{item.name_1}</h4>
                          <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>{item.employment_type || 'Unspecified'}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full font-mono font-black text-xs ${
                        isSelected ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'
                      }`}>
                        {item.similarity_pct}% Correlation
                      </span>
                    </div>

                    <div className={`grid grid-cols-2 gap-2 mt-3 pt-2 border-t text-[11px] font-mono ${
                      isSelected ? 'border-blue-500 text-blue-100' : 'border-slate-200 text-slate-600'
                    }`}>
                      <div>Income: <span className="font-bold">₹{item.monthly_income.toLocaleString('en-IN')}/mo</span></div>
                      <div>DPD: <span className={`font-bold ${item.max_days_past_due > 0 ? (isSelected ? 'text-amber-200' : 'text-rose-600') : (isSelected ? 'text-emerald-200' : 'text-emerald-600')}`}>{item.max_days_past_due} Days</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Match Explainability Drawer */}
          {selectedMatch && (
            <div className="lg:col-span-2 card-modern p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-extrabold text-slate-900">Peer Portfolio Comparison</h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Comparing Target Customer #{customerId} vs Peer #{selectedMatch.customer_id} ({selectedMatch.name_1})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onSelectCustomer(selectedMatch.customer_id)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all text-xs font-mono font-bold flex items-center gap-1.5 shadow-md"
                >
                  <span>Inspect Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Financial Metric Comparison Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px] block font-bold">Monthly Income</span>
                  <span className="font-extrabold text-slate-900">₹{selectedMatch.monthly_income.toLocaleString('en-IN')}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px] block font-bold">Working Balance</span>
                  <span className="font-extrabold text-blue-600">₹{selectedMatch.total_working_balance.toLocaleString('en-IN')}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px] block font-bold">Loan Outstanding</span>
                  <span className="font-extrabold text-amber-600">₹{selectedMatch.total_outstanding_loan.toLocaleString('en-IN')}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px] block font-bold">Bureau Credit Score</span>
                  <span className="font-extrabold text-emerald-600">{selectedMatch.credit_score} Pts</span>
                </div>
              </div>

              {/* Explainable Checklist: Why Similar? */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1.5 uppercase">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Key Financial Similarities (Matching Portfolio Factors)
                </h4>
                <div className="space-y-2 text-xs font-mono">
                  {selectedMatch.matching_features.map((mf: string, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold flex items-start gap-2">
                      <span className="text-emerald-700 font-bold">✓</span>
                      <span>{mf}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explainable Checklist: Caution / Risk Discrepancies */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-mono font-bold text-amber-800 flex items-center gap-1.5 uppercase">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Portfolio Risk Discrepancies Callout
                </h4>
                <div className="space-y-2 text-xs font-mono">
                  {selectedMatch.risk_discrepancies.map((rd: string, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold flex items-start gap-2">
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
