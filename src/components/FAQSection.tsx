import React, { useState, useMemo } from 'react';
import { FAQS_DATA, FAQItem } from '../data/faqs';
import { HelpCircle, ChevronDown, ChevronUp, Search, Sparkles, MessageCircleQuestion } from 'lucide-react';

interface FAQSectionProps {
  onOpenStudio?: () => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ onOpenStudio }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    'faq-1': true,
    'faq-2': true,
  });

  const categories = ['All', 'Platform & Voice', 'Panel Intelligence', 'Scoring & Calibration', 'Security & Enterprise'];

  const filteredFaqs = useMemo(() => {
    return FAQS_DATA.filter((faq) => {
      const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
      const matchesSearch =
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (faq.badge && faq.badge.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    filteredFaqs.forEach((faq) => {
      next[faq.id] = true;
    });
    setExpandedIds(next);
  };

  const handleCollapseAll = () => {
    setExpandedIds({});
  };

  return (
    <section id="faqs" className="w-full py-16 sm:py-24 bg-slate-50 border-t border-slate-200/80">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Everything you need to know
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Learn how our autonomous multi-interviewer panel, real-time voice latency engine, and adaptive scoring algorithms operate under the hood.
          </p>
        </div>

        {/* Filter Controls & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Expand / Collapse All */}
            <div className="flex items-center gap-2 self-end md:self-auto text-xs font-medium text-slate-500">
              <button
                type="button"
                onClick={handleExpandAll}
                className="hover:text-indigo-600 underline cursor-pointer"
              >
                Expand all
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="hover:text-indigo-600 underline cursor-pointer"
              >
                Collapse all
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g. latency, turn-taking, bias, resume, difficulty)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 outline-none transition"
            />
          </div>
        </div>

        {/* FAQs Accordion List */}
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
            <MessageCircleQuestion className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-800">No matching questions found</p>
            <p className="text-xs text-slate-500">Try adjusting your search keywords or switching category filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const isExpanded = !!expandedIds[faq.id];
              return (
                <div
                  key={faq.id}
                  id={faq.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? 'border-indigo-200 shadow-sm ring-1 ring-indigo-500/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(faq.id)}
                    className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
                  >
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center gap-2">
                        {faq.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80 uppercase tracking-wider font-mono">
                            {faq.badge}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">
                          {faq.category}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 pt-0.5">
                        {faq.question}
                      </h3>
                    </div>

                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isExpanded ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-5 sm:px-5 pt-0 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100 mt-1">
                      <p className="pt-3">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA within FAQ */}
        <div className="mt-12 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xl border border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mx-auto text-indigo-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 max-w-xl mx-auto">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">
              Ready to test your readiness with the AI panel?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Jump directly into a simulated voice round or calibrate your panel in under 30 seconds.
            </p>
          </div>
          {onOpenStudio && (
            <div>
              <button
                type="button"
                onClick={onOpenStudio}
                className="bg-white hover:bg-slate-100 text-slate-900 font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-sm cursor-pointer inline-flex items-center gap-2"
              >
                <span>Launch Interactive Studio</span>
                <span className="text-indigo-600 font-extrabold">→</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
