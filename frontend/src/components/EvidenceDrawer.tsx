import React from 'react';
import { X, FileText, Database, ShieldCheck } from 'lucide-react';
import type { CitationEvidence } from '../types';

interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  citations: CitationEvidence[];
  customerId: number | null;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  isOpen,
  onClose,
  citations,
  customerId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans animate-fade-in">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 text-slate-900 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/40">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-display font-extrabold text-white tracking-tight">Verified Bank Citations</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Verified ITSS Bank Record Citations for Customer #{customerId || 'Selected Customer'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-bold"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs bg-slate-50">
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center gap-2 font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Verified Data Policy: All information is grounded directly in official bank records.</span>
            </div>

            {citations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Database className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No citation records loaded.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-[11px] text-slate-500 block uppercase font-bold tracking-wider">
                  Verified Source Citations ({citations.length} Total):
                </span>

                {citations.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 transition-all space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200">
                        {c.table.replace('.csv', '').replace('.json', '').toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">Record Ref: #{c.record_id}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 text-[10px] block font-bold">Verified Field:</span>
                      <span className="text-slate-900 font-extrabold">{c.field_name}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 text-[10px] block font-bold">Record Value:</span>
                      <span className="text-blue-700 font-extrabold">{String(c.value)}</span>
                    </div>

                    {c.description && (
                      <p className="text-[11px] text-slate-600 leading-relaxed border-t border-slate-200 pt-1.5 font-medium">
                        {c.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="font-bold text-slate-300">ITSS Bank Platform</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
