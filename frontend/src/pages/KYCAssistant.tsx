import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, CheckCircle2, FileText, Upload, Check, ArrowRight, Building2
} from 'lucide-react';
import type { KycAssessmentResponse, KycFieldItem } from '../types';
import { fetchCustomerKyc, verifyCustomerKycDocument } from '../api';

interface KYCAssistantProps {
  customerId: number | null;
  onOpenEvidence: () => void;
  onKycUpdated: () => void;
}

export const KYCAssistant: React.FC<KYCAssistantProps> = ({ customerId, onOpenEvidence, onKycUpdated }) => {
  const [assessment, setAssessment] = useState<KycAssessmentResponse | null>(null);
  const [verifyingDoc, setVerifyingDoc] = useState<string | null>(null);
  const [docNumber, setDocNumber] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verifySuccessMsg, setVerifySuccessMsg] = useState<string | null>(null);

  const loadKyc = useCallback(async (cid: number) => {
    try {
      const data = await fetchCustomerKyc(cid);
      setAssessment(data);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (customerId) {
      loadKyc(customerId);
    }
  }, [customerId, loadKyc]);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !verifyingDoc) return;

    try {
      setVerifying(true);
      const res = await verifyCustomerKycDocument(customerId, {
        document_type: verifyingDoc,
        document_number: docNumber.trim() || `DOC-SBI-${Date.now()}`
      });

      if (res.success && res.updated_assessment) {
        setAssessment(res.updated_assessment);
        setVerifySuccessMsg(res.message);
        setVerifyingDoc(null);
        setDocNumber('');
        onKycUpdated();
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  if (!customerId) {
    return (
      <div className="glass-panel-sbi p-12 rounded-2xl text-center space-y-3 font-mono">
        <Building2 className="w-12 h-12 text-[#00A3E0] mx-auto opacity-50" />
        <p className="text-gray-400 text-sm">Please select an SBI customer from the top menu bar to view e-KYC compliance details.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. State Bank of India e-KYC Header Banner */}
      <div className="glass-panel-sbi p-6 rounded-2xl relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-[#003366] rounded-2xl text-[#00A3E0] border border-[#00A3E0]/30 shadow-lg">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-white tracking-tight">SBI e-KYC Compliance Assistant</h2>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#003366] text-[#00A3E0] border border-[#00A3E0]/40">
                  Customer #{customerId}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1 font-mono">
                Configuration-Driven Regulatory Rules • Dynamic Document Verification Engine
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onOpenEvidence}
              className="flex items-center space-x-2 px-4 py-2 bg-[#003366] hover:bg-[#003366]/80 text-[#00A3E0] border border-[#00A3E0]/40 rounded-xl text-xs font-mono font-bold transition-all shadow-md"
            >
              <FileText className="w-4 h-4 text-[#00A3E0]" />
              <span>Evidence Drawer ({assessment?.citations?.length || 0})</span>
            </button>
          </div>
        </div>

        {/* Dynamic Completeness Progress Bar */}
        {assessment && (
          <div className="pt-2 border-t border-gray-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-300 font-semibold flex items-center gap-2">
                Overall e-KYC Completeness: 
                <span className="text-[#00A3E0] font-bold">{assessment.completeness_percentage}%</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                assessment.overall_status === 'COMPLETE' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                STATUS: {assessment.overall_status}
              </span>
            </div>
            
            <div className="w-full bg-[#020A17] rounded-full h-3.5 p-0.5 border border-gray-800 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#003366] via-[#00A3E0] to-emerald-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${assessment.completeness_percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Success Banner Notice */}
      {verifySuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{verifySuccessMsg}</span>
          </div>
          <button onClick={() => setVerifySuccessMsg(null)} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* 2. Verification Form Modal / Drawer */}
      {verifyingDoc && (
        <div className="glass-panel-sbi p-6 rounded-2xl border-2 border-[#00A3E0] space-y-4 animate-fade-in shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#00A3E0]" />
              Verify Document: <span className="text-[#00A3E0]">{verifyingDoc}</span>
            </h3>
            <button onClick={() => setVerifyingDoc(null)} className="text-gray-400 hover:text-white text-xs font-mono">Cancel</button>
          </div>

          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5 font-semibold">
                Document Identification Number (PAN / Aadhaar / Passport / Utility Ref)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ABCDE1234F or 4521 8892 1029"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full bg-[#020A17] border border-[#00A3E0]/40 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3E0]"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setVerifyingDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={verifying}
                className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-[#00A3E0] text-[#0A192F] hover:bg-[#0284C7] transition-all shadow-md flex items-center gap-1.5"
              >
                {verifying ? 'Verifying in DuckDB...' : 'Confirm Verification & Update DB'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Category Breakdown & Missing Documents Checklist */}
      {assessment && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Regulatory Fields Status */}
          <div className="lg:col-span-2 glass-panel-sbi p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#00A3E0]" />
                e-KYC Master Field Compliance Status
              </h3>
              <span className="text-xs text-gray-400 font-mono">kyc_rules.json</span>
            </div>

            <div className="space-y-2.5">
              {assessment.fields.map((f: KycFieldItem, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#020A17]/60 border border-gray-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-100 text-xs font-mono">{f.label}</span>
                      <span className="text-[10px] text-gray-500 font-mono">({f.category_key})</span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                      Current Value: <span className="text-white font-semibold">{f.value !== null ? String(f.value) : 'MISSING'}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    {f.is_verified ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <button
                        onClick={() => setVerifyingDoc(f.documents_required[0] || 'PAN Card')}
                        className="px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold transition-all flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5" /> Verify Document
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Next Steps & Required Docs */}
          <div className="space-y-6">
            {/* Required Documents Checklist */}
            <div className="glass-panel-sbi p-5 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                <Upload className="w-5 h-5 text-amber-400" />
                Pending Verification Checklist
              </h3>

              {assessment.documents_checklist.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>All required KYC identity documents verified!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {assessment.documents_checklist.map((doc: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setVerifyingDoc(doc)}
                      className="w-full p-3 rounded-xl bg-[#020A17] border border-amber-500/30 text-left hover:border-[#00A3E0] transition-all text-xs font-mono text-gray-200 flex items-center justify-between group"
                    >
                      <span className="font-semibold text-amber-300">{doc}</span>
                      <span className="text-[10px] text-[#00A3E0] group-hover:underline flex items-center gap-1">
                        Verify →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Next Actions */}
            <div className="glass-panel-sbi p-5 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                <ArrowRight className="w-5 h-5 text-[#00A3E0]" />
                SBI Compliance Recommended Actions
              </h3>

              <div className="space-y-2 text-xs font-mono">
                {assessment.recommended_actions.map((act: string, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#020A17] border border-gray-800 text-gray-300 leading-relaxed">
                    {act}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
