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
        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> KYC Verified
        </span>
      );
    }
    return (
      <button
        onClick={onNavigateToKyc}
        className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 transition-all flex items-center gap-1.5 shadow-sm"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
        <span>KYC {s} (Action Required)</span>
      </button>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* 1. Customer Profile Banner */}
      <div className="card-light p-6 rounded-2xl space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/20">
              {customer.name_1 ? customer.name_1.charAt(0) : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{customer.name_1}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  Customer ID: #{customer.customer_id}
                </span>
                {getKycBadge(customer.kyc_status)}
              </div>
              <p className="text-xs text-slate-600 mt-1 font-mono flex items-center gap-3 flex-wrap font-medium">
                <span>Address: {customer.street || 'N/A'}, {customer.town_country || 'N/A'}</span>
                <span>•</span>
                <span>Employment: {customer.employment_type || 'Unspecified'}</span>
                <span>•</span>
                <span>Monthly Income: ₹{customer.monthly_income ? customer.monthly_income.toLocaleString('en-IN') : '0'}/mo</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onOpenEvidence}
              className="flex items-center space-x-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-mono font-bold transition-all shadow-sm"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Record Citations ({data.citations?.length || 0})</span>
            </button>
          </div>
        </div>

        {/* Financial Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-200">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-xs font-mono font-bold text-slate-500">Total Working Balance</span>
            <p className="text-xl font-mono font-black text-blue-600">
              ₹{data.total_working_balance ? data.total_working_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </p>
            <span className="text-[10px] text-slate-500 font-mono">{accounts.length} Active Accounts</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-xs font-mono font-bold text-slate-500">Total Outstanding Loans</span>
            <p className="text-xl font-mono font-black text-amber-600">
              ₹{data.total_outstanding_loan ? data.total_outstanding_loan.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </p>
            <span className="text-[10px] text-slate-500 font-mono">{loans.length} Active Loans</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-xs font-mono font-bold text-slate-500">Max Overdue (DPD)</span>
            <p className={`text-xl font-mono font-black ${data.max_days_past_due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {data.max_days_past_due} Days
            </p>
            <span className="text-[10px] text-slate-500 font-mono">Days Past Due</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-xs font-mono font-bold text-slate-500">Suspicious Txn Alerts</span>
            <p className={`text-xl font-mono font-black ${suspicious_txn_count > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {suspicious_txn_count} Flags
            </p>
            <span className="text-[10px] text-slate-500 font-mono">Transaction Monitoring</span>
          </div>
        </div>
      </div>

      {/* 2. Deposit Accounts & Loans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposit Accounts Card */}
        <div className="card-light p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Deposit & Savings Accounts</h3>
                <p className="text-xs text-slate-500 font-mono">accounts.csv ({accounts.length} records)</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {accounts.map((acc) => (
              <div key={acc.account_id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs font-mono">{acc.account_title}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-mono font-bold border border-blue-200">
                      {acc.product || 'SAVINGS'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Acc #{acc.account_id} • Currency: {acc.currency} • Opened: {acc.opening_date || 'N/A'}
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-extrabold text-blue-600">
                    ₹{acc.working_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="block text-[10px] text-slate-500">Working Balance</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loan Liabilities Card */}
        <div className="card-light p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Loan Accounts & Credit Exposure</h3>
                <p className="text-xs text-slate-500 font-mono">loans.csv ({loans.length} records)</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {loans.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono italic p-4 text-center">No active loans found for this customer.</p>
            ) : (
              loans.map((ln) => (
                <div key={ln.loan_id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-300 transition-all flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs font-mono">{ln.product} LOAN</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        ln.days_past_due > 0 ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {ln.status} ({ln.days_past_due} DPD)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Loan #{ln.loan_id} • Sanctioned: ₹{ln.sanctioned_amount.toLocaleString('en-IN')} @ {ln.interest_rate}%
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-sm font-extrabold text-amber-600">
                      ₹{ln.outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="block text-[10px] text-slate-500">Outstanding</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Transaction History Table */}
      <div className="card-light p-5 rounded-2xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Recent Transactions & Monitoring Alerts</h3>
              <p className="text-xs text-slate-500 font-mono">transactions.csv ({transactions.length} total records)</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3 rounded-l-lg">Txn ID</th>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Narrative / Counterparty</th>
                <th className="p-3">Amount</th>
                <th className="p-3 rounded-r-lg">Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {transactions.slice(0, 8).map((t) => (
                <tr key={t.txn_id} className="hover:bg-slate-50 transition-all">
                  <td className="p-3 text-blue-700 font-extrabold">#{t.txn_id}</td>
                  <td className="p-3 text-slate-700 font-medium">{t.txn_date}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.txn_type === 'CREDIT' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {t.txn_type}
                    </span>
                  </td>
                  <td className="p-3 text-slate-900">
                    <div className="font-bold">{t.narrative || 'Direct Transfer'}</div>
                    {t.counterparty && <div className="text-[10px] text-slate-500">{t.counterparty}</div>}
                  </td>
                  <td className="p-3 font-extrabold text-slate-900">
                    ₹{Math.abs(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3">
                    {t.is_suspicious === 'Y' ? (
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold flex items-center gap-1 w-max">
                        <AlertTriangle className="w-3 h-3 text-rose-600" /> Suspicious
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Normal</span>
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
