import React, { useState } from 'react';
import { Calendar, Trash2, FolderOpen, ArrowRight, DollarSign, Download, Edit2, Check, X, Users } from 'lucide-react';
import { TripPlan } from '../types';
import { formatCurrency } from '../utils';

interface SavedTripsProps {
  savedPlans: TripPlan[];
  activeTripId: string | null;
  onLoadPlan: (plan: TripPlan) => void;
  onDeletePlan: (id: string) => void;
  onRenamePlan: (id: string, newName: string) => void;
}

export default function SavedTrips({
  savedPlans,
  activeTripId,
  onLoadPlan,
  onDeletePlan,
  onRenamePlan,
}: SavedTripsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setTempName(currentName);
  };

  const saveRename = (id: string) => {
    if (!tempName.trim()) return;
    onRenamePlan(id, tempName.trim());
    setEditingId(null);
  };

  const handleExportPlan = (plan: TripPlan) => {
    const filename = `${plan.preferences.destination.toLowerCase().replace(/[^a-z0-9]/g, '_')}_itinerary.json`;
    const jsonStr = JSON.stringify(plan, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <FolderOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-slate-800">My Saved Travel Plans</h2>
          <p className="text-xs text-slate-500">Access and load all your previously generated smart travel itineraries.</p>
        </div>
      </div>

      {savedPlans.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <FolderOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-slate-800 text-lg">No saved trips yet</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Use the 'Plan Trip' tab to specify your destination, dates, and budget. Once generated, your plans will automatically be saved to your dashboard!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {savedPlans.map(plan => {
            const isEditing = editingId === plan.id;
            const isActive = activeTripId === plan.id;

            // Formatted Date
            const createdDate = new Date(plan.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            const tripDatesStr = plan.preferences.startDate
              ? `${new Date(plan.preferences.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${plan.preferences.endDate ? new Date(plan.preferences.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}`
              : `${plan.preferences.durationDays} Days`;

            return (
              <div
                key={plan.id}
                className={`group bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                  isActive ? 'border-teal-500 ring-2 ring-teal-500/10' : 'border-slate-100'
                }`}
              >
                {/* Top Card Section */}
                <div className="p-5 space-y-4">
                  {/* Title & Rename Block */}
                  <div className="flex items-start justify-between gap-2.5">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <input
                          type="text"
                          value={tempName}
                          onChange={e => setTempName(e.target.value)}
                          className="w-full px-2 py-1 text-xs sm:text-sm border border-teal-400 rounded focus:outline-none focus:ring-2 focus:ring-teal-500/15"
                          autoFocus
                        />
                        <button
                          onClick={() => saveRename(plan.id)}
                          className="p-1 bg-teal-600 hover:bg-teal-700 text-white rounded shrink-0"
                          title="Save Rename"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded shrink-0"
                          title="Cancel Rename"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display font-extrabold text-slate-800 text-base leading-snug tracking-tight truncate flex items-center gap-1.5" title={plan.preferences.source ? `${plan.preferences.source} to ${plan.preferences.destination}` : plan.preferences.destination}>
                          {plan.preferences.source ? `${plan.preferences.source} ➔ ` : ''}{plan.preferences.destination}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400 font-medium">Created: {createdDate}</span>
                          {isActive && (
                            <span className="text-[9px] font-extrabold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded-full border border-teal-100 uppercase tracking-wide">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {!isEditing && (
                      <button
                        onClick={() => startRename(plan.id, plan.preferences.destination)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-all shrink-0"
                        title="Rename Destination"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Trip details */}
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500 border-t border-b border-slate-50 py-3 font-sans">
                    <div className="space-y-1">
                      <span className="block text-[8px] uppercase font-bold text-slate-400 tracking-wider">Duration</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        {tripDatesStr}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[8px] uppercase font-bold text-slate-400 tracking-wider">Travelers</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400 shrink-0" />
                        {plan.preferences.travelersCount || 1} { (plan.preferences.travelersCount || 1) === 1 ? 'Pax' : 'Pax' }
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[8px] uppercase font-bold text-slate-400 tracking-wider">Max Budget</span>
                      <span className="font-bold text-teal-600 flex items-center gap-0.5 font-mono">
                        {formatCurrency(plan.preferences.budgetLimit, plan.preferences.homeCurrency)}
                      </span>
                    </div>
                  </div>

                  {/* Vibe Tags */}
                  {plan.preferences.travelStyle && plan.preferences.travelStyle.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {plan.preferences.travelStyle.slice(0, 3).map((style, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] font-bold text-indigo-700 bg-indigo-50 rounded px-2 py-0.5"
                        >
                          {style}
                        </span>
                      ))}
                      {plan.preferences.travelStyle.length > 3 && (
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-50 rounded px-1 py-0.5">
                          +{plan.preferences.travelStyle.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions Row */}
                <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onDeletePlan(plan.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExportPlan(plan)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-100 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold font-sans"
                      title="Download Itinerary JSON"
                    >
                      <Download className="w-4 h-4" /> Export
                    </button>
                    <button
                      onClick={() => onLoadPlan(plan)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold font-display transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-teal-50 text-teal-700 cursor-default border border-teal-100'
                          : 'bg-teal-600 hover:bg-teal-700 text-white hover:shadow shadow-sm active:scale-[0.98]'
                      }`}
                    >
                      {isActive ? 'Active' : 'Load Trip'}
                      {!isActive && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
