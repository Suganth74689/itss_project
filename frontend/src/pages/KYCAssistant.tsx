import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, CheckCircle2, FileText, Upload, Check, ArrowRight, Layers
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
        document_number: docNumber.trim() || `DOC-ITSS-${Date.now()}`
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
      <div className="card-modern p-12 text-center space-y-3 font-mono">
        <Layers className="w-12 h-12 text-blue-600 mx-auto opacity-50" />
        <p className="text-slate-500 text-sm">Please select a customer from the top menu bar to view e-KYC compliance details.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* 1. e-KYC Header Banner */}
      <div className="card-modern p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/25">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">ITSS e-KYC & Compliance Verification</h2>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Customer ID: #{customerId}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-mono">
                Regulatory Compliance Verification System • Official Identity Audit
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onOpenEvidence}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-mono font-bold transition-all shadow-sm"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Citations ({assessment?.citations?.length || 0})</span>
            </button>
          </div>
        </div>

        {/* Dynamic Completeness Progress Bar */}
        {assessment && (
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-700 font-bold flex items-center gap-2">
                Overall e-KYC Verification: 
                <span className="text-blue-600 font-black">{assessment.completeness_percentage}%</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                assessment.overall_status === 'COMPLETE' 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                STATUS: {assessment.overall_status}
              </span>
            </div>
            
            <div className="w-full bg-slate-100 rounded-full h-3.5 p-0.5 border border-slate-200 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${assessment.completeness_percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Success Banner Notice */}
      {verifySuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center justify-between shadow-sm font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{verifySuccessMsg}</span>
          </div>
          <button onClick={() => setVerifySuccessMsg(null)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">✕</button>
        </div>
      )}

      {/* 2. Verification Form Modal / Drawer */}
      {verifyingDoc && (
        <div className="card-modern p-6 border-2 border-blue-600 space-y-4 animate-fade-in shadow-xl bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-base font-display font-extrabold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Verify Document: <span className="text-blue-600">{verifyingDoc}</span>
            </h3>
            <button onClick={() => setVerifyingDoc(null)} className="text-slate-400 hover:text-slate-700 text-xs font-mono font-bold">Cancel</button>
          </div>

          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-700 mb-1.5 font-bold">
                Document Identification Number (PAN / Aadhaar / Passport / Utility Ref)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ABCDE1234F or 4521 8892 1029"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white font-semibold"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setVerifyingDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={verifying}
                className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md flex items-center gap-1.5"
              >
                {verifying ? 'Updating Records...' : 'Confirm Verification & Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Category Breakdown & Missing Documents Checklist */}
      {assessment && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Regulatory Fields Status */}
          <div className="lg:col-span-2 card-modern p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-display font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                e-KYC Mandatory Field Compliance Status
              </h3>
              <span className="text-xs text-slate-500 font-mono">Regulatory Verification</span>
            </div>

            <div className="space-y-2.5">
              {assessment.fields.map((f: KycFieldItem, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs font-mono">{f.label}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({f.category_key})</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                      Current Value: <span className="text-slate-900 font-bold">{f.value !== null ? String(f.value) : 'MISSING'}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    {f.is_verified ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-mono font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Verified
                      </span>
                    ) : (
                      <button
                        onClick={() => setVerifyingDoc(f.documents_required[0] || 'PAN Card')}
                        className="px-3 py-1 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 text-xs font-mono font-bold transition-all flex items-center gap-1 shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-700" /> Verify Document
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
            <div className="card-modern p-5 space-y-4">
              <h3 className="text-base font-display font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
                <Upload className="w-5 h-5 text-amber-600" />
                Pending Verification Checklist
              </h3>

              {assessment.documents_checklist.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>All required KYC identity documents verified!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {assessment.documents_checklist.map((doc: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setVerifyingDoc(doc)}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-amber-300 text-left hover:bg-amber-50 hover:border-amber-400 transition-all text-xs font-mono text-slate-800 flex items-center justify-between group shadow-sm font-semibold"
                    >
                      <span className="font-bold text-amber-900">{doc}</span>
                      <span className="text-[10px] text-blue-600 group-hover:underline flex items-center gap-1 font-bold">
                        Verify →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Next Actions */}
            <div className="card-modern p-5 space-y-4">
              <h3 className="text-base font-display font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
                <ArrowRight className="w-5 h-5 text-blue-600" />
                Compliance Recommended Actions
              </h3>

              <div className="space-y-2 text-xs font-mono">
                {assessment.recommended_actions.map((act: string, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold leading-relaxed">
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
