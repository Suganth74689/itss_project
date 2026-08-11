import React, { useState, useEffect } from 'react';
import { Search, AlertOctagon, CheckCircle2, FileText, ArrowRight, ShieldAlert, User, Cpu, Zap, Building2 } from 'lucide-react';
import type { FaqQueryResponse, FaqItem, OllamaStatusResponse } from '../types';
import { queryFaq, fetchFaqs, fetchOllamaStatus } from '../api';

interface FAQAssistantProps {
  selectedCustomerId?: number | null;
  onOpenEvidence: () => void;
}

export const FAQAssistant: React.FC<FAQAssistantProps> = ({ selectedCustomerId, onOpenEvidence }) => {
  const [question, setQuestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<FaqQueryResponse | null>(null);
  const [faqsList, setFaqsList] = useState<FaqItem[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFaqsList();
    loadOllamaStatus();
  }, []);

  async function loadFaqsList() {
    try {
      const data = await fetchFaqs();
      setFaqsList(data);
    } catch (err) {
      console.error('Failed to load FAQs list');
    }
  }

  async function loadOllamaStatus() {
    try {
      const st = await fetchOllamaStatus();
      setOllamaStatus(st);
    } catch (err) {
      console.error('Failed to fetch Ollama status');
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
      loadOllamaStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to process RAG query.');
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
    { label: '🛑 Guardrail: Who is the prime minister?', query: 'Who is the prime minister of India?', type: 'guardrail' },
  ];

  const answerText = queryResult?.answer || queryResult?.matched_faq?.answer || '';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. State Bank of India YONO AI Assistant Header Banner */}
      <div className="glass-panel-sbi p-6 rounded-2xl relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-[#003366] rounded-2xl text-[#00A3E0] border border-[#00A3E0]/30 shadow-lg">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-white tracking-tight">SBI YONO Banking & Ollama RAG Assistant</h2>
                
                {/* Live Ollama / DuckDB Status Badge */}
                {ollamaStatus?.available ? (
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    Ollama Active ({ollamaStatus.default_model || 'llama3'})
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#003366] text-[#00A3E0] border border-[#00A3E0]/40 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#00A3E0]" />
                    DuckDB RAG Active (Ollama Offline)
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-300 mt-1 font-mono">
                Context-Aware Customer 360 RAG & Restricted SBI Knowledge Base • Ollama Local LLM Generative RAG
              </p>
            </div>
          </div>

          <button
            onClick={onOpenEvidence}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#0A192F] hover:bg-[#003366] border border-[#00A3E0]/30 rounded-xl text-gray-200 text-xs font-mono font-bold transition-all shrink-0"
          >
            <FileText className="w-4 h-4 text-[#00A3E0]" />
            <span>Citations ({queryResult?.citations?.length || 0})</span>
          </button>
        </div>

        {/* SBI Interactive Search Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative">
          <input
            type="text"
            placeholder={
              selectedCustomerId
                ? `Ask about SBI Customer #${selectedCustomerId}'s balance, KYC, loans or banking policies...`
                : 'Ask an SBI banking policy question or select a customer for account details...'
            }
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full pl-12 pr-32 py-3.5 bg-[#020A17]/90 border border-[#00A3E0]/40 rounded-2xl text-white placeholder-gray-400 text-sm focus:outline-none focus:border-[#00A3E0] font-sans shadow-lg"
          />
          <Search className="w-5 h-5 text-[#00A3E0] absolute left-4 top-4" />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="absolute right-2.5 top-2 px-5 py-2 bg-[#00A3E0] hover:bg-[#0284C7] text-[#0A192F] rounded-xl text-xs font-bold font-mono transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md"
          >
            {loading ? 'Querying...' : 'Ask Assistant'}
          </button>
        </form>

        {/* Sample Query Pills */}
        <div className="space-y-2 pt-2 border-t border-gray-800/80">
          <span className="text-[11px] font-mono text-gray-400 block">Sample Queries & Guardrail Tests:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {sampleQueries.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSearch(s.query)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 border ${
                  s.type === 'guardrail'
                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30 font-mono'
                    : s.type === 'customer'
                    ? 'bg-[#003366]/60 hover:bg-[#003366] text-[#00A3E0] border-[#00A3E0]/40 font-mono'
                    : 'bg-[#0A192F] hover:bg-[#003366] text-gray-200 border-gray-700'
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
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Query Result Renderer */}
      {queryResult && (
        <div className="space-y-4 animate-fade-in">
          {/* A. MATCHED QUERY ANSWER CARD */}
          {queryResult.status === 'MATCHED' && (
            <div className="glass-panel-sbi p-6 rounded-2xl border border-[#00A3E0]/40 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl border bg-[#003366] text-[#00A3E0] border-[#00A3E0]/30">
                    {queryResult.query_type === 'CUSTOMER_SPECIFIC' ? <User className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {queryResult.matched_faq?.question || (queryResult.query_type === 'CUSTOMER_SPECIFIC' ? `SBI Customer 360 Response (${queryResult.customer_name || 'Selected Customer'})` : queryResult.user_question)}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 font-mono">
                        {queryResult.query_type === 'CUSTOMER_SPECIFIC' ? `Live DuckDB Core Banking Retrieval` : `SBI Banking Knowledge Engine`}
                      </span>
                      {queryResult.llm_provider && (
                        <span className="px-2 py-0.5 rounded bg-[#003366] text-[#00A3E0] border border-[#00A3E0]/40 text-[10px] font-mono font-bold">
                          {queryResult.llm_provider}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                  queryResult.confidence_score === 'HIGH'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {queryResult.confidence_score} CONFIDENCE ({queryResult.similarity_score})
                </span>
              </div>

              {/* Answer Content */}
              <div className="p-4 rounded-xl bg-[#020A17]/80 border border-gray-800 text-gray-100 text-xs font-mono leading-relaxed whitespace-pre-line">
                {answerText || 'No answer text returned.'}
              </div>

              {/* Grounding Evidence Citations */}
              {queryResult.citations && queryResult.citations.length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-800 text-xs font-mono">
                  <span className="text-gray-400">Grounding Evidence: {queryResult.citations.length} DuckDB record citations</span>
                  <button
                    onClick={onOpenEvidence}
                    className="text-[#00A3E0] hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>View Evidence Drawer →</span>
                  </button>
                </div>
              )}

              {/* Related FAQs */}
              {queryResult.suggested_related_faqs && queryResult.suggested_related_faqs.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-800">
                  <span className="text-[11px] font-mono text-gray-400 block">Related SBI Banking FAQs:</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {queryResult.suggested_related_faqs.map((rf) => (
                      <button
                        key={rf.id}
                        onClick={() => handleSearch(rf.question)}
                        className="p-2.5 rounded-xl bg-[#020A17]/60 border border-gray-800 text-left hover:border-[#00A3E0]/40 transition-all text-xs text-gray-300 font-medium flex items-center justify-between"
                      >
                        <span className="line-clamp-1">{rf.question}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#00A3E0] shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* B. OUT-OF-SCOPE REFUSAL CARD */}
          {queryResult.status === 'REFUSED' && (
            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-4 shadow-xl">
              <div className="flex items-center space-x-3 border-b border-rose-500/20 pb-3">
                <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Out-of-Scope Query Refusal</h3>
                  <p className="text-xs text-rose-300 font-mono">SBI Safety Guardrail Enforcement</p>
                </div>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <p className="p-3.5 rounded-xl bg-[#020A17]/80 border border-rose-500/20 text-rose-200 leading-relaxed">
                  ⛔ {queryResult.refusal_reason}
                </p>
                <p className="text-gray-400">
                  Explanation: {queryResult.explanation}
                </p>
              </div>

              <div className="pt-2 border-t border-rose-500/20 space-y-2">
                <span className="text-[11px] font-mono text-gray-400 block">Try Asking Authorized SBI Banking Questions:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleSearch('What is my total working balance?')}
                    className="px-3 py-1 bg-[#020A17] border border-gray-700 text-gray-200 rounded-lg text-xs font-mono"
                  >
                    💰 What is my total working balance?
                  </button>
                  <button
                    onClick={() => handleSearch('What are the credit card lounge access rules?')}
                    className="px-3 py-1 bg-[#020A17] border border-gray-700 text-gray-200 rounded-lg text-xs font-mono"
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
        <div className="glass-panel-sbi p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#00A3E0]" />
              SBI Verified Banking Knowledge Repository ({faqsList.length} FAQs)
            </h3>
            <span className="text-xs text-gray-400 font-mono">faqs.json</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {faqsList.slice(0, 6).map((faq) => (
              <div
                key={faq.id}
                onClick={() => handleSearch(faq.question)}
                className="p-3.5 rounded-xl bg-[#020A17]/60 border border-gray-800 hover:border-[#00A3E0]/40 cursor-pointer transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-[#003366] text-[#00A3E0] text-[10px] font-mono font-bold border border-[#00A3E0]/30">
                    {faq.category}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">ID: {faq.id}</span>
                </div>
                <h4 className="font-bold text-gray-100">{faq.question}</h4>
                <p className="text-gray-400 text-[11px] line-clamp-2 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
