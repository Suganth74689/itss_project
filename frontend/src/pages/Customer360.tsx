import React from 'react';
import type { Customer360Response } from '../types';
import { 
  Building2, CreditCard, DollarSign, AlertTriangle, ShieldCheck, 
  FileSpreadsheet, Clock, ChevronRight, BadgeAlert, Layers, Upload
} from 'lucide-react';

interface Customer360Props {
  data: Customer360Response;
  onOpenEvidence: () => void;
  onNavigateToKyc?: () => void;
}

export const Customer360: React.FC<Customer360Props> = ({ data, onOpenEvidence, onNavigateToKyc }) => {
  const { 
    customer, accounts, loans, transactions,
    total_working_balance, total_outstanding_loan, total_sanctioned_loan,
    max_days_past_due, total_approved_limit, total_available_limit,
    suspicious_txn_count
  } = data;

  const getKycBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETE':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> KYC COMPLETE</span>;
      case 'PENDING':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> KYC PENDING</span>;
      case 'EXPIRED':
      default:
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> KYC EXPIRED</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Customer Main Banner / Card */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-600/20">
              {customer.name_1.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-white tracking-tight">{customer.name_1}</h2>
                {getKycBadge(customer.kyc_status)}
                
                {/* Dynamic Quick Verification Action */}
                {customer.kyc_status.toUpperCase() !== 'COMPLETE' && onNavigateToKyc && (
                  <button
                    onClick={onNavigateToKyc}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-full transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Verify Document & Clear Hold →</span>
                  </button>
                )}

                <span className="text-xs font-mono text-gray-400 bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-md">
                  ID: {customer.customer_id}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                <span>{customer.street}, {customer.town_country}</span>
                <span>•</span>
                <span>Nationality: {customer.nationality}</span>
                <span>•</span>
                <span>Sector: {customer.sector === 1001 ? '1001 (Retail Individual)' : '2001 (Business)'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t lg:border-t-0 lg:border-l border-gray-800 pt-4 lg:pt-0 lg:pl-6">
            <div>
              <span className="text-xs text-gray-400">Monthly Income</span>
              <p className="text-lg font-bold text-white font-mono">₹{customer.monthly_income.toLocaleString('en-IN')}</p>
            </div>
            <div className="h-8 w-px bg-gray-800" />
            <div>
              <span className="text-xs text-gray-400">Employment</span>
              <p className="text-sm font-semibold text-blue-300">{customer.employment_type || 'N/A'}</p>
            </div>
            <div className="h-8 w-px bg-gray-800" />
            <div>
              <span className="text-xs text-gray-400">Account Officer</span>
              <p className="text-sm font-semibold text-gray-300 font-mono">RM-{customer.account_officer || 'DEFAULT'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Working Balance Card */}
        <div className="glass-panel p-4 rounded-xl border border-gray-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Total Working Balance</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400">
            ₹{total_working_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-400 font-mono">
            Across {accounts.length} active bank account(s)
          </p>
        </div>

        {/* Loan Exposure Card */}
        <div className="glass-panel p-4 rounded-xl border border-gray-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Total Outstanding Loans</span>
            <CreditCard className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-blue-300">
            ₹{total_outstanding_loan.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-gray-400">Sanctioned: ₹{total_sanctioned_loan.toLocaleString('en-IN')}</span>
            {max_days_past_due > 0 ? (
              <span className="text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">DPD: {max_days_past_due} Days</span>
            ) : (
              <span className="text-emerald-400 font-medium">DPD: 0 (Current)</span>
            )}
          </div>
        </div>

        {/* Credit Limit Available */}
        <div className="glass-panel p-4 rounded-xl border border-gray-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Available Credit Limit</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-indigo-300">
            ₹{total_available_limit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-400 font-mono">
            Approved Limit: ₹{total_approved_limit.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Suspicious Txn Alerts */}
        <div className="glass-panel p-4 rounded-xl border border-gray-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Suspicious Txn Alerts</span>
            <AlertTriangle className={`w-4 h-4 ${suspicious_txn_count > 0 ? 'text-rose-400' : 'text-gray-500'}`} />
          </div>
          <p className={`text-2xl font-bold font-mono ${suspicious_txn_count > 0 ? 'text-rose-400' : 'text-gray-300'}`}>
            {suspicious_txn_count} {suspicious_txn_count === 1 ? 'Flag' : 'Flags'}
          </p>
          <button 
            onClick={onOpenEvidence}
            className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
          >
            <span>Inspect Evidence Records</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 3. Detailed Data Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounts Section */}
        <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-400" />
              Accounts ({accounts.length})
            </h3>
            <span className="text-xs text-gray-400 font-mono">accounts.csv</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 font-mono">
                  <th className="py-2.5 px-3">Account ID</th>
                  <th className="py-2.5 px-3">Product / Title</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono">
                {accounts.map((acc) => (
                  <tr key={acc.account_id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-blue-400 font-bold">{acc.account_id}</td>
                    <td className="py-2.5 px-3 text-gray-200">{acc.account_title}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                      ₹{acc.working_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {acc.posting_restrict ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-sans font-semibold border border-rose-500/20">
                          {acc.posting_restrict} HOLD
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-sans font-semibold border border-emerald-500/20">
                          ACTIVE
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Loans & Exposure Section */}
        <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              Loans & Credit Exposure ({loans.length})
            </h3>
            <span className="text-xs text-gray-400 font-mono">loans.csv</span>
          </div>

          <div className="overflow-x-auto">
            {loans.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-xs">No active loans found for this customer.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 font-mono">
                    <th className="py-2.5 px-3">Loan ID</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Sanctioned</th>
                    <th className="py-2.5 px-3 text-right">Outstanding</th>
                    <th className="py-2.5 px-3 text-center">Status / DPD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-mono">
                  {loans.map((ln) => (
                    <tr key={ln.loan_id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-2.5 px-3 text-indigo-400 font-bold">{ln.loan_id}</td>
                      <td className="py-2.5 px-3 text-gray-300">{ln.product}</td>
                      <td className="py-2.5 px-3 text-right text-gray-400">₹{ln.sanctioned_amount.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right text-blue-300 font-bold">₹{ln.outstanding.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-center">
                        {ln.days_past_due > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 text-[10px] font-sans font-bold border border-rose-500/30">
                            {ln.days_past_due} DPD OVERDUE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-sans font-semibold border border-emerald-500/20">
                            {ln.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* 4. Transactions List */}
      <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Recent Transactions ({transactions.length})
          </h3>
          <span className="text-xs text-gray-400 font-mono">transactions.csv</span>
        </div>

        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-xs">No transactions recorded for this customer.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 font-mono">
                  <th className="py-2.5 px-3">Txn ID</th>
                  <th className="py-2.5 px-3">Account</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Counterparty / Narrative</th>
                  <th className="py-2.5 px-3 text-center">Channel</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono">
                {transactions.slice(0, 10).map((t) => {
                  const isDebit = t.amount < 0;
                  return (
                    <tr key={t.txn_id} className={`hover:bg-gray-800/30 transition-colors ${t.is_suspicious === 'Y' ? 'bg-rose-500/5' : ''}`}>
                      <td className="py-2.5 px-3 font-bold text-gray-300">{t.txn_id}</td>
                      <td className="py-2.5 px-3 text-gray-400">{t.account_id}</td>
                      <td className="py-2.5 px-3 text-gray-400">{t.txn_date}</td>
                      <td className="py-2.5 px-3 text-gray-200">
                        <span className="font-semibold text-gray-100">{t.counterparty || 'N/A'}</span>
                        <span className="text-gray-500 text-[11px] block">{t.narrative}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded text-[10px]">
                          {t.channel || 'SYSTEM'}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold ${isDebit ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isDebit ? '-' : '+'}₹{Math.abs(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {t.is_suspicious === 'Y' ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-sans font-bold border border-rose-500/40 flex items-center justify-center gap-1">
                            <BadgeAlert className="w-3 h-3 text-rose-400" />
                            SUSPICIOUS
                          </span>
                        ) : (
                          <span className="text-gray-600 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
