import React from 'react';
import { UserCheck, CheckCircle, AlertCircle } from 'lucide-react';
import type { Customer360Response } from '../types';

interface KYCPreviewProps {
  data: Customer360Response | null;
}

export const KYCPreview: React.FC<KYCPreviewProps> = ({ data }) => {
  const customer = data?.customer;

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">B2 — KYC Completeness Assistant</h2>
              <p className="text-xs text-gray-400">Configurable compliance rule verification engine (Phase 2 Preview)</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs rounded-full font-mono">
            Phase 2 Ready
          </span>
        </div>

        {customer ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-800">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-300">Customer KYC Overview</h3>
              <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 space-y-3 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Customer Name:</span>
                  <span className="text-white font-bold">{customer.name_1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current KYC Status:</span>
                  <span className={`font-bold ${customer.kyc_status === 'COMPLETE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {customer.kyc_status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Address Recorded:</span>
                  <span className="text-gray-300">{customer.street}, {customer.town_country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Nationality / Residence:</span>
                  <span className="text-gray-300">{customer.nationality} / {customer.residence}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-300">Configurable Compliance Rules Checklist</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-900/60 border border-gray-800">
                  <span className="text-gray-300 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Full Name & DOB Recorded</span>
                  <span className="text-emerald-400 font-mono">VERIFIED</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-900/60 border border-gray-800">
                  <span className="text-gray-300 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Residential Address Available</span>
                  <span className="text-emerald-400 font-mono">VERIFIED</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-900/60 border border-gray-800">
                  <span className="text-gray-300 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-400" /> Document Verification Expiry Flag</span>
                  <span className="text-amber-400 font-mono">{customer.kyc_status}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500 text-xs">Select a customer above to view KYC compliance assessment.</div>
        )}
      </div>
    </div>
  );
};
