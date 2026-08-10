import React, { useState } from 'react';
import { X, FileText, Search, Database, ArrowUpRight, CheckCircle2 } from 'lucide-react';
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
  const [filterText, setFilterText] = useState('');

  if (!isOpen) return null;

  const filteredCitations = citations.filter(
    (c) =>
      c.table.toLowerCase().includes(filterText.toLowerCase()) ||
      c.record_id.toLowerCase().includes(filterText.toLowerCase()) ||
      c.field_name.toLowerCase().includes(filterText.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(filterText.toLowerCase()))
  );

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0D1322] border-l border-gray-800 shadow-2xl flex flex-col transform transition-transform ease-in-out duration-300">
      {/* Drawer Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#0B0F19]">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Source Record Evidence
            </h2>
            <p className="text-xs text-gray-400">
              Customer #{customerId} • {citations.length} Verified Field Citations
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-3 border-b border-gray-800/80 bg-gray-900/40">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter evidence by table, record ID or field..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Citation Cards List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredCitations.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-xs">
            No record citations match your filter.
          </div>
        ) : (
          filteredCitations.map((c, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-blue-500/40 transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-800/60 font-mono text-[11px] font-semibold flex items-center gap-1">
                    <Database className="w-3 h-3 text-blue-400" />
                    {c.table}
                  </span>
                  <span className="font-mono text-gray-300 font-bold bg-gray-800 px-1.5 py-0.5 rounded text-[11px]">
                    ID: {c.record_id}
                  </span>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>

              <div className="bg-black/40 p-2.5 rounded-lg border border-gray-800 font-mono text-xs space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Field:</span>
                  <span className="text-amber-300 font-semibold">{c.field_name}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Value:</span>
                  <span className="text-emerald-400 font-bold">{String(c.value)}</span>
                </div>
              </div>

              {c.description && (
                <p className="text-[11px] text-gray-400 leading-normal pl-0.5">
                  {c.description}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Notice */}
      <div className="p-3 border-t border-gray-800 bg-[#0B0F19] text-[11px] text-gray-400 flex items-center justify-between">
        <span>Deterministic CSV Source Proof</span>
        <div className="flex items-center text-blue-400 font-mono text-[10px]">
          <span>DuckDB Engine</span>
          <ArrowUpRight className="w-3 h-3 ml-0.5" />
        </div>
      </div>
    </div>
  );
};
