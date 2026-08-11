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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0A192F] border-l border-[#00A3E0]/40 text-gray-100 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-5 bg-[#020A17] border-b border-[#00A3E0]/30 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-[#003366] rounded-xl text-[#00A3E0] border border-[#00A3E0]/30">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">SBI Grounding Evidence Drawer</h3>
                <p className="text-xs text-gray-400 font-mono">
                  Deterministic DuckDB Record Citations for #{customerId || 'Selected Customer'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-[#003366]/40 border border-[#00A3E0]/30 text-[#00A3E0] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00A3E0] shrink-0" />
              <span>Zero-Hallucination Policy: All facts grounded in raw DuckDB records.</span>
            </div>

            {citations.length === 0 ? (
              <div className="p-8 text-center text-gray-400 space-y-2">
                <Database className="w-8 h-8 text-gray-600 mx-auto" />
                <p>No citation evidence records loaded.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-[11px] text-gray-400 block uppercase font-bold tracking-wider">
                  Active Source Citations ({citations.length} total):
                </span>

                {citations.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#020A17] border border-gray-800 hover:border-[#00A3E0]/50 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-[#003366] text-[#00A3E0] text-[10px] font-bold border border-[#00A3E0]/30">
                        {c.table}
                      </span>
                      <span className="text-[10px] text-gray-400">Record ID: #{c.record_id}</span>
                    </div>

                    <div>
                      <span className="text-gray-400 text-[10px] block">Target Field:</span>
                      <span className="text-white font-bold">{c.field_name}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#0A192F] border border-gray-800">
                      <span className="text-gray-400 text-[10px] block">Record Field Value:</span>
                      <span className="text-[#00A3E0] font-bold">{String(c.value)}</span>
                    </div>

                    {c.description && (
                      <p className="text-[11px] text-gray-400 leading-relaxed border-t border-gray-800/60 pt-1.5">
                        {c.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-[#020A17] border-t border-gray-800 flex items-center justify-between text-xs font-mono text-gray-400">
            <span>State Bank of India • YONO AI</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#003366] hover:bg-[#003366]/80 text-[#00A3E0] rounded-lg font-bold border border-[#00A3E0]/40"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
