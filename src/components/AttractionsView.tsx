import React from 'react';
import { Eye, MapPin, Ticket, Clock, Edit3, Save, FileText, CheckSquare } from 'lucide-react';
import { Attraction } from '../types';
import { formatCurrency } from '../utils';

interface AttractionsViewProps {
  attractions: Attraction[];
  notes: string;
  onUpdateNotes: (notes: string) => void;
  homeCurrency?: string;
}

export default function AttractionsView({ attractions, notes, onUpdateNotes, homeCurrency }: AttractionsViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Attractions List */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-800">Must-Visit Attractions & Sights</h2>
            <p className="text-xs text-slate-500">Popular tourist highlights and recommended local gems.</p>
          </div>
        </div>

        {attractions && attractions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {attractions.map((attraction, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-all flex gap-4 items-start"
              >
                {/* Number bullet */}
                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                  {idx + 1}
                </div>

                <div className="space-y-2 flex-1 min-w-0">
                  <div>
                    <h3 className="font-display font-bold text-slate-800 text-base">{attraction.name}</h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans">
                    {attraction.description}
                  </p>

                  <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 text-xs font-sans">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Ticket className="w-3.5 h-3.5 text-slate-400" />
                      Entry Cost:{' '}
                      <span className="font-bold text-emerald-600">
                        {attraction.cost === 0 ? 'Free' : formatCurrency(attraction.cost, homeCurrency)}
                      </span>
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Best Time:{' '}
                      <span className="font-bold text-slate-700">{attraction.bestTime}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
            No tourist recommendations available.
          </div>
        )}
      </div>

      {/* Trip Notes notepad */}
      <div className="lg:col-span-5 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-800">Trip Notebook & Scratchpad</h2>
            <p className="text-xs text-slate-500">Jot down hotel reservation codes, flight info, or custom checklists.</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/30 text-amber-800">
            <span className="text-xs font-semibold flex items-center gap-1.5 leading-none">
              <FileText className="w-4 h-4 text-amber-600" />
              Scratchpad - Saved Automatically
            </span>
          </div>

          <textarea
            rows={14}
            value={notes}
            onChange={e => onUpdateNotes(e.target.value)}
            placeholder="Write details like:
- Hotel Booking Code: #PARIS-7294B
- Flight 104 Boarding: 4:30 PM (Terminal 2E)
- Souvenirs to buy:
  * Matcha powder
  * Local postcards
- Emergency Contacts: +33 1..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 placeholder-slate-400 font-mono text-xs leading-relaxed resize-none bg-amber-50/10 focus:bg-white transition-all shadow-inner"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5 text-teal-500" />
              Persisted with trip record
            </span>
            <span>{notes.length} characters</span>
          </div>
        </div>
      </div>
    </div>
  );
}
