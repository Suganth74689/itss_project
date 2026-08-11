import React, { useState, useEffect } from 'react';
import { UserCheck, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, FileText, ArrowRight, RefreshCw, CheckSquare } from 'lucide-react';
import type { KycAssessmentResponse } from '../types';
import { fetchCustomerKyc } from '../api';

interface KYCAssistantProps {
  customerId: number | null;
  onOpenEvidence: () => void;
}

export const KYCAssistant: React.FC<KYCAssistantProps> = ({ customerId, onOpenEvidence }) => {
  const [kycData, setKycData] = useState<KycAssessmentResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    async function loadKyc() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCustomerKyc(customerId!);
        setKycData(data);
      } catch (err: any) {
        setError(`Failed to load KYC Assessment for Customer #${customerId}`);
      } finally {
        setLoading(false);
      }
    }
    loadKyc();
  }, [customerId]);

  if (!customerId) {
    return (
      <div className="py-12 text-center text-gray-500 text-sm glass-panel rounded-2xl">
        Select a customer above to view KYC compliance assessment.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="text-sm text-gray-400 font-mono">Evaluating KYC compliance rules for Customer #{customerId}...</p>
      </div>
    );
  }

  if (error || !kycData) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <span>{error || 'Unable to evaluate KYC rules.'}</span>
        </div>
      </div>
    );
  }

  const { overall_status, completeness_percentage, categories, fields, recommended_actions, documents_checklist } = kycData;

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETE':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> KYC COMPLETE</span>;
      case 'PENDING':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> KYC PENDING</span>;
      case 'EXPIRED':
      default:
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><XCircle className="w-4 h-4" /> KYC EXPIRED</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white tracking-tight">{kycData.name_1}</h2>
                {getStatusBadge(overall_status)}
              </div>
              <p className="text-xs text-gray-400 mt-1 font-mono">
                Customer ID: {kycData.customer_id} • Configuration-Driven Rule Engine
              </p>
            </div>
          </div>

          <button
            onClick={onOpenEvidence}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl text-blue-300 text-xs font-semibold transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Verify Source Field Evidence ({kycData.citations.length})</span>
          </button>
        </div>

        {/* Completeness Bar */}
        <div className="space-y-2 pt-2 border-t border-gray-800">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400">KYC Profile Completeness Score:</span>
            <span className={`font-bold ${completeness_percentage === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {completeness_percentage}% Verified
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                completeness_percentage === 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-rose-500'
              }`}
              style={{ width: `${completeness_percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Categorized Rule Checklist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.category_key} className="glass-panel p-4 rounded-xl border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{cat.title}</h3>
              {cat.is_complete ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/20">
                  PASSED
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono font-bold border border-amber-500/20">
                  ATTENTION
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs">
              {fields
                .filter((f) => f.category_key === cat.category_key)
                .map((f) => (
                  <div key={f.field_name} className="flex items-center justify-between p-2 rounded-lg bg-gray-900/60 border border-gray-800/80">
                    <span className="text-gray-300 font-medium">{f.label}:</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-gray-400 text-[11px]">{String(f.value)}</span>
                      {f.is_verified ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Actions & Document Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Actions */}
        <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex items-center space-x-2 text-blue-400">
            <ArrowRight className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Recommended Next Actions</h3>
          </div>

          <div className="space-y-2 text-xs">
            {recommended_actions.map((act, i) => (
              <div key={i} className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 text-gray-200 font-medium leading-relaxed flex items-start gap-2">
                <span className="text-blue-400 font-bold">{act.charAt(0)}</span>
                <span>{act.length > 1 ? act.substring(1) : act}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Required Documents Suggestions */}
        <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex items-center space-x-2 text-amber-400">
            <CheckSquare className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Suggested Documents Checklist</h3>
          </div>

          <div className="space-y-2 text-xs">
            {documents_checklist.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                ✓ All required KYC documents are verified on file. No additional documents needed.
              </div>
            ) : (
              documents_checklist.map((doc, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-800 text-gray-300 font-mono flex items-center justify-between">
                  <span>📄 {doc}</span>
                  <span className="text-amber-400 text-[10px] font-semibold bg-amber-500/10 px-2 py-0.5 rounded">REQUIRED</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
