import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, CheckCircle2, FileText, ArrowRight, User, Sparkles, Landmark, Bot } from 'lucide-react';
import type { FaqQueryResponse, FaqItem } from '../types';
import { queryFaq, fetchFaqs } from '../api';

interface FAQAssistantProps {
  selectedCustomerId?: number | null;
  onOpenEvidence: () => void;
}

export const FAQAssistant: React.FC<FAQAssistantProps> = ({ selectedCustomerId, onOpenEvidence }) => {
  const [question, setQuestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<FaqQueryResponse | null>(null);
  const [faqsList, setFaqsList] = useState<FaqItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFaqsList();
  }, []);

  async function loadFaqsList() {
    try {
      const data = await fetchFaqs();
      setFaqsList(data);
    } catch (err) {
      console.error('Failed to load FAQs list');
    }
  }

  const handleSearch = async (qText?: string) => {
    const targetQ = qText || question;
    if (!targetQ.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await queryFaq(targetQ.trim(), selectedCustomerId || undefined);
      setQueryResult(res);
      setQuestion(targetQ);
    } catch (err: any) {
      setError(err.message || 'Failed to process inquiry.');
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    { label: '💰 What is my working balance?', query: 'What is my total working balance?', type: 'customer' },
    { label: '📋 Is my KYC status complete?', query: 'Is my KYC status complete or expired?', type: 'customer' },
    { label: '⚠️ Do I have overdue loan DPD?', query: 'Do I have any overdue loan DPD or missed EMI?', type: 'customer' },
    { label: '🚩 Suspicious transaction alerts?', query: 'Are there any suspicious transaction alerts on my account?', type: 'customer' },
    { label: '🏦 Home Loan Interest Rates?', query: 'What are the current interest rates offered on home loans?', type: 'faq' },
    { label: '🔒 Security: Non-banking query test', query: 'Who is the prime minister of India?', type: 'guardrail' },
  ];

  const answerText = queryResult?.answer || queryResult?.matched_faq?.answer || '';

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* 1. ITSS Virtual Assistant Banner */}
      <div className="card-modern p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/25">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">ITSS Bank Virtual AI Assistant</h2>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  ITSS Smart AI Active
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-mono">
                Verified Customer Account Records & ITSS Official Banking Services Support
              </p>
            </div>
          </div>

          <button
            onClick={onOpenEvidence}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-slate-700 text-xs font-mono font-bold transition-all shrink-0"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Verified Citations ({queryResult?.citations?.length || 0})</span>
          </button>
        </div>

        {/* Interactive Search Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative">
          <input
            type="text"
            placeholder={
              selectedCustomerId
                ? `Ask about Customer #${selectedCustomerId}'s balance, KYC, loans or ITSS Bank services...`
                : 'Ask an ITSS Bank policy question or select a customer for account details...'
            }
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full pl-12 pr-36 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:bg-white font-semibold shadow-inner"
          />
          <Search className="w-5 h-5 text-blue-600 absolute left-4 top-4" />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="absolute right-2.5 top-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold font-mono transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md"
          >
            {loading ? 'Processing...' : 'Ask Assistant'}
          </button>
        </form>

        {/* Sample Query Pills */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <span className="text-[11px] font-mono font-bold text-slate-500 block uppercase">Frequently Asked Questions & Quick Inquiries:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {sampleQueries.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSearch(s.query)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 border shadow-sm ${
                  s.type === 'guardrail'
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200 font-mono'
                    : s.type === 'customer'
                    ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200 font-mono'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Query Result Renderer */}
      {queryResult && (
        <div className="space-y-4 animate-fade-in">
          {/* A. MATCHED QUERY ANSWER CARD */}
          {queryResult.status === 'MATCHED' && (
            <div className="card-modern p-6 space-y-4 border-2 border-blue-500/30">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                    {queryResult.query_type === 'CUSTOMER_SPECIFIC' ? <User className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-display font-extrabold text-slate-900">
                      {queryResult.matched_faq?.question || (queryResult.query_type === 'CUSTOMER_SPECIFIC' ? `Verified Customer Information (${queryResult.customer_name || 'Selected Customer'})` : queryResult.user_question)}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500 font-mono">
                        ITSS Commercial Banking Intelligence
                      </span>
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold border bg-emerald-50 text-emerald-800 border-emerald-300">
                  VERIFIED RESPONSE
                </span>
              </div>

              {/* Answer Content */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono leading-relaxed whitespace-pre-line font-semibold">
                {answerText || 'No answer text returned.'}
              </div>

              {/* Grounding Evidence Citations */}
              {queryResult.citations && queryResult.citations.length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs font-mono">
                  <span className="text-slate-500">Verified Citations: {queryResult.citations.length} ITSS Bank database record(s)</span>
                  <button
                    onClick={onOpenEvidence}
                    className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                  >
                    <span>View Citations Drawer →</span>
                  </button>
                </div>
              )}

              {/* Related FAQs */}
              {queryResult.suggested_related_faqs && queryResult.suggested_related_faqs.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-mono font-bold text-slate-500 block uppercase">Related Banking Inquiries:</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {queryResult.suggested_related_faqs.map((rf) => (
                      <button
                        key={rf.id}
                        onClick={() => handleSearch(rf.question)}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left hover:border-blue-300 hover:bg-blue-50/50 transition-all text-xs text-slate-800 font-semibold flex items-center justify-between shadow-sm"
                      >
                        <span className="line-clamp-1">{rf.question}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* B. OUT-OF-SCOPE REFUSAL CARD */}
          {queryResult.status === 'REFUSED' && (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-4 shadow-sm">
              <div className="flex items-center space-x-3 border-b border-amber-200 pb-3">
                <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 border border-amber-300">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-display font-extrabold text-slate-900">ITSS Bank Security & Scope Notice</h3>
                  <p className="text-xs text-amber-700 font-mono font-bold">Banking Inquiry Scope</p>
                </div>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <p className="p-3.5 rounded-xl bg-white border border-amber-200 text-amber-900 leading-relaxed font-semibold">
                  ℹ️ {queryResult.refusal_reason}
                </p>
              </div>

              <div className="pt-2 border-t border-amber-200 space-y-2">
                <span className="text-[11px] font-mono text-slate-500 block uppercase font-bold">Try Asking ITSS Bank Questions:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleSearch('What is my total working balance?')}
                    className="px-3 py-1 bg-white border border-slate-300 text-slate-800 rounded-lg text-xs font-mono font-semibold shadow-sm"
                  >
                    💰 What is my total working balance?
                  </button>
                  <button
                    onClick={() => handleSearch('What are the credit card lounge access rules?')}
                    className="px-3 py-1 bg-white border border-slate-300 text-slate-800 rounded-lg text-xs font-mono font-semibold shadow-sm"
                  >
                    💳 Credit Card Lounge Rules
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Default FAQs Repository Browser */}
      {!queryResult && (
        <div className="card-modern p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-base font-display font-extrabold text-slate-900 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-blue-600" />
              ITSS Bank Official Knowledge Repository ({faqsList.length} FAQs)
            </h3>
            <span className="text-xs text-slate-500 font-mono">Verified Bank Services</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {faqsList.slice(0, 6).map((faq) => (
              <div
                key={faq.id}
                onClick={() => handleSearch(faq.question)}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-mono font-bold border border-blue-200">
                    {faq.category}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Ref: #{faq.id}</span>
                </div>
                <h4 className="font-bold text-slate-900">{faq.question}</h4>
                <p className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
