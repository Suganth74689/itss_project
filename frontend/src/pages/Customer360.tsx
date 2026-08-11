import React from 'react';
import { 
  CreditCard, Landmark, AlertTriangle, FileText, CheckCircle2, Activity
} from 'lucide-react';
import type { Customer360Response } from '../types';

interface Customer360Props {
  data: Customer360Response;
  onOpenEvidence: () => void;
  onNavigateToKyc: () => void;
}

export const Customer360: React.FC<Customer360Props> = ({ data, onOpenEvidence, onNavigateToKyc }) => {
  const { customer, accounts, loans, transactions, suspicious_txn_count } = data;

  const getKycBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'COMPLETE' || s === 'VERIFIED') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> KYC Verified
        </span>
      );
    }
    return (
      <button
        onClick={onNavigateToKyc}
        className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>KYC {s} (Action Required)</span>
      </button>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. State Bank of India Customer Profile Header Banner */}
      <div className="glass-panel-sbi p-6 rounded-2xl relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-[#003366] text-[#00A3E0] border border-[#00A3E0]/40 flex items-center justify-center font-bold text-xl shadow-lg shadow-[#00A3E0]/20">
              {customer.name_1 ? customer.name_1.charAt(0) : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-white tracking-tight">{customer.name_1}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#003366] text-[#00A3E0] border border-[#00A3E0]/40">
                  ID: #{customer.customer_id}
                </span>
                {getKycBadge(customer.kyc_status)}
              </div>
              <p className="text-xs text-gray-300 mt-1 font-mono flex items-center gap-3 flex-wrap">
                <span>Address: {customer.street || 'N/A'}, {customer.town_country || 'N/A'}</span>
                <span>•</span>
                <span>Employment: {customer.employment_type || 'Unspecified'}</span>
                <span>•</span>
                <span>Declared Income: ₹{customer.monthly_income ? customer.monthly_income.toLocaleString('en-IN') : '0'}/mo</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onOpenEvidence}
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#003366] hover:bg-[#003366]/80 text-[#00A3E0] border border-[#00A3E0]/40 rounded-xl text-xs font-mono font-bold transition-all shadow-md"
            >
              <FileText className="w-4 h-4 text-[#00A3E0]" />
              <span>Record Citations ({data.citations?.length || 0})</span>
            </button>
          </div>
        </div>

        {/* Dynamic Financial Overview Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-gray-800/80">
          <div className="p-3.5 rounded-xl bg-[#020A17]/80 border border-[#00A3E0]/20 space-y-1">
            <span className="text-[11px] font-mono text-gray-400">Total Working Balance</span>
            <p className="text-lg font-mono font-bold text-[#00A3E0]">
              ₹{data.total_working_balance ? data.total_working_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </p>
            <span className="text-[10px] text-gray-400 font-mono">{accounts.length} Active Accounts</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#020A17]/80 border border-[#00A3E0]/20 space-y-1">
            <span className="text-[11px] font-mono text-gray-400">Total Outstanding Loans</span>
            <p className="text-lg font-mono font-bold text-amber-400">
              ₹{data.total_outstanding_loan ? data.total_outstanding_loan.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </p>
            <span className="text-[10px] text-gray-400 font-mono">{loans.length} Loan Exposure</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#020A17]/80 border border-[#00A3E0]/20 space-y-1">
            <span className="text-[11px] font-mono text-gray-400">Max Overdue (DPD)</span>
            <p className={`text-lg font-mono font-bold ${data.max_days_past_due > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {data.max_days_past_due} Days
            </p>
            <span className="text-[10px] text-gray-400 font-mono">Days Past Due Risk</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#020A17]/80 border border-[#00A3E0]/20 space-y-1">
            <span className="text-[11px] font-mono text-gray-400">Suspicious Txn Alerts</span>
            <p className={`text-lg font-mono font-bold ${suspicious_txn_count > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {suspicious_txn_count} Flags
            </p>
            <span className="text-[10px] text-gray-400 font-mono">Transaction Security</span>
          </div>
        </div>
      </div>

      {/* 2. Accounts & Loans Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Accounts Table */}
        <div className="glass-panel-sbi p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-[#003366] rounded-xl text-[#00A3E0]">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Deposit & Savings Accounts</h3>
                <p className="text-xs text-gray-400 font-mono">accounts.csv ({accounts.length} records)</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {accounts.map((acc) => (
              <div key={acc.account_id} className="p-3.5 rounded-xl bg-[#020A17]/60 border border-gray-800 hover:border-[#00A3E0]/40 transition-all flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-100 text-xs font-mono">{acc.account_title}</span>
                    <span className="px-2 py-0.5 rounded bg-[#003366] text-[#00A3E0] text-[10px] font-mono font-bold">
                      {acc.product || 'SAVINGS'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                    Acc #{acc.account_id} • Currency: {acc.currency} • Opened: {acc.opening_date || 'N/A'}
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-bold text-[#00A3E0]">
                    ₹{acc.working_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="block text-[10px] text-gray-400">Working Balance</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loan Liabilities Table */}
        <div className="glass-panel-sbi p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-[#003366] rounded-xl text-amber-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Loan Accounts & Credit Exposure</h3>
                <p className="text-xs text-gray-400 font-mono">loans.csv ({loans.length} records)</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {loans.length === 0 ? (
              <p className="text-xs text-gray-400 font-mono italic p-4 text-center">No active loans found for this customer.</p>
            ) : (
              loans.map((ln) => (
                <div key={ln.loan_id} className="p-3.5 rounded-xl bg-[#020A17]/60 border border-gray-800 hover:border-[#00A3E0]/40 transition-all flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-100 text-xs font-mono">{ln.product} LOAN</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        ln.days_past_due > 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {ln.status} ({ln.days_past_due} DPD)
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                      Loan #{ln.loan_id} • Sanctioned: ₹{ln.sanctioned_amount.toLocaleString('en-IN')} @ {ln.interest_rate}%
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-sm font-bold text-amber-400">
                      ₹{ln.outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="block text-[10px] text-gray-400">Outstanding</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Transaction History */}
      <div className="glass-panel-sbi p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#003366] rounded-xl text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Recent Transactions & Monitoring Alerts</h3>
              <p className="text-xs text-gray-400 font-mono">transactions.csv ({transactions.length} total records)</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#020A17] text-gray-400 uppercase text-[10px]">
              <tr>
                <th className="p-3 rounded-l-lg">Txn ID</th>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Narrative / Counterparty</th>
                <th className="p-3">Amount</th>
                <th className="p-3 rounded-r-lg">Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {transactions.slice(0, 8).map((t) => (
                <tr key={t.txn_id} className="hover:bg-[#0A192F]/60 transition-all">
                  <td className="p-3 text-[#00A3E0] font-bold">#{t.txn_id}</td>
                  <td className="p-3 text-gray-300">{t.txn_date}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.txn_type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {t.txn_type}
                    </span>
                  </td>
                  <td className="p-3 text-gray-200">
                    <div className="font-semibold">{t.narrative || 'Direct Transfer'}</div>
                    {t.counterparty && <div className="text-[10px] text-gray-400">{t.counterparty}</div>}
                  </td>
                  <td className="p-3 font-bold text-gray-100">
                    ₹{Math.abs(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3">
                    {t.is_suspicious === 'Y' ? (
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 w-max">
                        <AlertTriangle className="w-3 h-3" /> Suspicious
                      </span>
                    ) : (
                      <span className="text-gray-500 text-[10px]">Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
