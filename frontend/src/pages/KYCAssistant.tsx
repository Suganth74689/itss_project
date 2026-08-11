import React, { useState, useEffect } from 'react';
import { UserCheck, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, FileText, ArrowRight, RefreshCw, CheckSquare, Upload, X, Database } from 'lucide-react';
import type { KycAssessmentResponse, KycVerifyDocumentRequest } from '../types';
import { fetchCustomerKyc, verifyCustomerKycDocument } from '../api';

interface KYCAssistantProps {
  customerId: number | null;
  onOpenEvidence: () => void;
  onKycUpdated?: () => void;
}

export const KYCAssistant: React.FC<KYCAssistantProps> = ({ customerId, onOpenEvidence, onKycUpdated }) => {
  const [kycData, setKycData] = useState<KycAssessmentResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [docType, setDocType] = useState<string>('Government Issued ID (PAN/Aadhaar)');
  const [docNumber, setDocNumber] = useState<string>('');
  const [docNotes, setDocNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!customerId) return;
    loadKyc();
  }, [customerId]);

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

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !docNumber.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      const req: KycVerifyDocumentRequest = {
        document_type: docType,
        document_number: docNumber.trim(),
        notes: docNotes.trim() || undefined
      };

      const res = await verifyCustomerKycDocument(customerId, req);
      setKycData(res.updated_assessment);
      setSuccessMsg(res.message);
      setShowModal(false);
      setDocNumber('');
      setDocNotes('');

      if (onKycUpdated) onKycUpdated();
    } catch (err: any) {
      setError(err.message || 'Document verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

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
      {/* Dynamic Success Alert Banner */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between font-mono animate-fade-in">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-white tracking-tight">{kycData.name_1}</h2>
                {getStatusBadge(overall_status)}
              </div>
              <p className="text-xs text-gray-400 mt-1 font-mono">
                Customer ID: {kycData.customer_id} • Persistent DuckDB Rule Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Interactive Document Verification Trigger Button */}
            {overall_status !== 'COMPLETE' && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all ring-2 ring-emerald-400/30"
              >
                <Upload className="w-4 h-4" />
                <span>Verify Required Document</span>
              </button>
            )}

            <button
              onClick={onOpenEvidence}
              className="flex items-center gap-2 px-3.5 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl text-gray-300 text-xs font-semibold transition-all"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Citations ({kycData.citations.length})</span>
            </button>
          </div>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-400">
              <CheckSquare className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Required Documents Checklist</h3>
            </div>
            {overall_status !== 'COMPLETE' && (
              <button
                onClick={() => setShowModal(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-mono underline"
              >
                + Verify Document
              </button>
            )}
          </div>

          <div className="space-y-2 text-xs">
            {documents_checklist.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>All required KYC documents are verified on file. No additional documents needed.</span>
              </div>
            ) : (
              documents_checklist.map((doc, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-800 text-gray-300 font-mono flex items-center justify-between">
                  <span>📄 {doc}</span>
                  <button
                    onClick={() => {
                      setDocType(doc);
                      setShowModal(true);
                    }}
                    className="text-amber-400 hover:text-amber-300 text-[10px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded border border-amber-500/30 transition-colors"
                  >
                    VERIFY NOW →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Interactive Document Verification Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-gray-700 space-y-5 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Verify KYC Document</h3>
                  <p className="text-xs text-gray-400 font-mono">Dynamic DuckDB Database Mutation</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Target Document Type:</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded-xl text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="Government Issued ID (PAN/Aadhaar)">Government Issued ID (PAN/Aadhaar)</option>
                  <option value="Utility Bill / Address Proof">Utility Bill / Address Proof</option>
                  <option value="FATCA / CRS Declaration Form">FATCA / CRS Declaration Form</option>
                  <option value="Salary Slips (3 months) / Income Tax Return">Salary Slips (3 months) / Income Tax Return</option>
                  <option value="KYC Refresh Form / Re-KYC Declaration">KYC Refresh Form / Re-KYC Declaration</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Document Reference / ID Number:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PAN-RSHARMA-2026-X or DOC-994812"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Verification Notes (Optional):</label>
                <textarea
                  rows={2}
                  placeholder="Add officer verification notes..."
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-mono leading-relaxed">
                ℹ️ Submitting this verification executes a real-time SQL UPDATE statement on DuckDB table <code>customers</code>: <code>SET kyc_status = 'COMPLETE'</code>.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !docNumber.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating DB...</span>
                    </>
                  ) : (
                    <span>Submit & Verify KYC</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
