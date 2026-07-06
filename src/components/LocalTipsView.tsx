import React, { useState } from 'react';
import { Sun, CheckSquare, ShieldCheck, Languages, Check, ShoppingBag } from 'lucide-react';
import { LocalTips } from '../types';

interface LocalTipsViewProps {
  tips: LocalTips;
}

export default function LocalTipsView({ tips }: LocalTipsViewProps) {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const togglePackingItem = (item: string) => {
    setCheckedItems(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column - Weather and Packing */}
      <div className="lg:col-span-6 space-y-6">
        {/* Weather */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2.5 text-amber-600 font-display font-bold text-base border-b border-slate-50 pb-3">
            <Sun className="w-5 h-5 text-amber-500" />
            Seasonal Weather & Climate
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
            {tips.weather}
          </p>
        </div>

        {/* Packing Checklist */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-teal-600 font-display font-bold text-base border-b border-slate-50 pb-3">
            <ShoppingBag className="w-5 h-5 text-teal-500" />
            Essential Packing Checklist
          </div>
          <p className="text-xs text-slate-400">Keep track of crucial, destination-specific items before you depart.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {tips.packing && tips.packing.length > 0 ? (
              tips.packing.map((item, idx) => {
                const isChecked = checkedItems.includes(item);
                return (
                  <button
                    key={idx}
                    onClick={() => togglePackingItem(item)}
                    className={`flex items-center text-left p-2.5 rounded-xl border text-xs font-semibold font-sans transition-all select-none ${
                      isChecked
                        ? 'bg-slate-50 border-slate-150 text-slate-400 line-through'
                        : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700 shadow-sm'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center mr-2.5 transition-all shrink-0 ${
                      isChecked ? 'bg-teal-500 border-teal-500 text-white' : 'bg-white border-slate-300'
                    }`}>
                      {isChecked && <Check className="w-2.5 h-2.5 stroke-[4px]" />}
                    </div>
                    <span className="truncate">{item}</span>
                  </button>
                );
              })
            ) : (
              <div className="col-span-2 text-xs text-slate-500 py-4 text-center">
                No packing essentials listed.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Safety and Phrases */}
      <div className="lg:col-span-6 space-y-6">
        {/* Safety Tips */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2.5 text-emerald-600 font-display font-bold text-base border-b border-slate-50 pb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Safety & Local Etiquette Guidelines
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
            {tips.safety}
          </p>
        </div>

        {/* Phrases Dictionary */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-indigo-600 font-display font-bold text-base border-b border-slate-50 pb-3">
            <Languages className="w-5 h-5 text-indigo-500" />
            Handy Local Phrases
          </div>
          <p className="text-xs text-slate-400">Speak like a local! Simple phrases to navigate transport and dining easily.</p>

          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {tips.phrases && tips.phrases.length > 0 ? (
              tips.phrases.map((phrase, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50/50 hover:bg-slate-50 p-3 rounded-xl border border-slate-100/50 flex justify-between items-center gap-4 transition-all"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">English</span>
                    <h4 className="text-xs font-bold text-slate-700 font-sans">{phrase.english}</h4>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Local Pronunciation</span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-indigo-700 font-sans">{phrase.local}</h4>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-4 text-center">
                No local language phrases recommended.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
