import React, { useState } from 'react';
import { HelpCircle, Search, Lock, ShieldAlert, CheckCircle2, ArrowRight, Sparkles, BookOpen, AlertCircle } from 'lucide-react';
import type { FaqQueryResponse } from '../types';
import { queryFaq } from '../api';

interface FAQAssistantProps {
  onOpenEvidence: () => void;
}

export const FAQAssistant: React.FC<FAQAssistantProps> = () => {
  const [question, setQuestion] = useState<string>('');
  const [response, setResponse] = useState<FaqQueryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const sampleBankingQuestions = [
    "What documents are required to open a savings account?",
    "How can I reset my NetBanking password?",
    "What is the minimum credit score for a personal loan?",
    "What happens when my KYC status expires?",
    "What are the transfer limits for NEFT, RTGS, and IMPS?"
  ];

  const outOfScopeQuestions = [
    "Who is the Prime Minister of India?",
    "Write Python code for quicksort algorithm",
    "Who won yesterday's cricket match?"
  ];

  const handleSearch = async (queryText: string) => {
    if (!queryText || !queryText.trim()) return;
    setQuestion(queryText);
    try {
      setLoading(true);
      const res = await queryFaq(queryText);
      setResponse(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Search Input */}
      <div className="glass-panel p-6 rounded-2xl space-y-5 border border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">
              <HelpCircle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">B3 — Bank FAQ Assistant</h2>
              <p className="text-xs text-gray-400">Restricted Knowledge RAG & Guardrailed Answer Engine</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-xs font-mono">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span>Strict Banking Guardrails Active</span>
          </div>
        </div>

        {/* Search Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(question);
          }}
          className="relative"
        >
          <input
            type="text"
            placeholder="Ask any banking question (e.g. 'How to reset netbanking password?')..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full pl-12 pr-32 py-3.5 bg-gray-900/90 border border-gray-700 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all font-sans"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-4 pointer-events-none" />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="absolute right-2 top-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Ask FAQ'}
          </button>
        </form>

        {/* Sample Banking Questions Pills */}
        <div className="space-y-2 pt-2 border-t border-gray-800">
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-gray-300">Sample Banking Queries:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sampleBankingQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSearch(q)}
                className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 text-xs transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Out-of-Scope Guardrail Test Panel */}
        <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-rose-300">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Interviewer Guardrail Test Panel (Non-Banking Prompts):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {outOfScopeQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSearch(q)}
                className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs transition-colors flex items-center gap-1.5"
              >
                <span>🚫 {q}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Response View Container */}
      {response && (
        <div className="space-y-4">
          {response.status === 'MATCHED' && response.matched_faq ? (
            /* Matched FAQ Card */
            <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-blue-950 text-blue-300 border border-blue-800 font-mono text-xs font-bold">
                    ID: {response.matched_faq.id}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-gray-800 text-gray-300 text-xs font-medium">
                    Category: {response.matched_faq.category}
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confidence: {response.confidence_score} ({Math.round(response.similarity_score * 100)}%)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white leading-snug">
                  {response.matched_faq.question}
                </h3>
                <div className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 text-sm text-gray-200 leading-relaxed font-sans">
                  {response.matched_faq.answer}
                </div>
              </div>

              {/* Related FAQs Suggestions */}
              {response.suggested_related_faqs.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-gray-800">
                  <h4 className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Related Bank FAQs:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {response.suggested_related_faqs.map((rel) => (
                      <button
                        key={rel.id}
                        onClick={() => handleSearch(rel.question)}
                        className="p-2.5 rounded-lg bg-gray-900/60 hover:bg-gray-800 border border-gray-800 text-left text-xs text-blue-300 hover:text-blue-200 transition-colors flex items-center justify-between"
                      >
                        <span>{rel.question}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-500 shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Refusal Notice Card */
            <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 bg-rose-950/10 space-y-4">
              <div className="flex items-center space-x-3 text-rose-400">
                <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Out-of-Scope Prompt Refused</h3>
                  <p className="text-xs text-rose-300 font-mono">Restricted Domain Guardrail Enforced</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-900/90 border border-rose-900/50 text-xs text-gray-300 leading-relaxed font-sans">
                {response.refusal_reason}
              </div>

              <div className="text-xs text-gray-400 flex items-center gap-1.5 font-mono">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Simulated refusal score: {Math.round(response.similarity_score * 100)}% relevance (Below 18% threshold).</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
