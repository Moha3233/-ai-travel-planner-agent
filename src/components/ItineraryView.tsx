import React, { useState } from 'react';
import { 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Bus, 
  AlertCircle,
  Volume2,
  BookOpen,
  Shield,
  HeartHandshake,
  Sparkles,
  CheckSquare
} from 'lucide-react';
import { DayItinerary, Activity, LocalTips, TravelNewsItem } from '../types';
import { formatCurrency } from '../utils';

interface ItineraryViewProps {
  itinerary: DayItinerary[];
  onUpdateItinerary: (updatedItinerary: DayItinerary[]) => void;
  homeCurrency?: string;
  destination: string;
  localTips?: LocalTips;
  travelNews?: TravelNewsItem[];
}

export default function ItineraryView({ 
  itinerary, 
  onUpdateItinerary, 
  homeCurrency, 
  destination,
  localTips,
  travelNews
}: ItineraryViewProps) {
  const [expandedDays, setExpandedDays] = useState<number[]>([1]); // Day 1 expanded by default
  const [selectedDayNum, setSelectedDayNum] = useState<number>(1);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [addingToDay, setAddingToDay] = useState<number | null>(null);

  // New activity form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLoc, setNewLoc] = useState('');
  const [newCost, setNewCost] = useState<number>(0);
  const [newTime, setNewTime] = useState<'Morning' | 'Afternoon' | 'Evening'>('Morning');
  const [newTransit, setNewTransit] = useState('');

  const toggleDay = (dayNum: number) => {
    setExpandedDays(prev =>
      prev.includes(dayNum) ? prev.filter(d => d !== dayNum) : [...prev, dayNum]
    );
    setSelectedDayNum(dayNum);
    setSelectedActivityId(null);
  };

  const handleToggleActivityCompleted = (dayNum: number, activityId: string) => {
    const updated = itinerary.map(day => {
      if (day.dayNumber === dayNum) {
        return {
          ...day,
          activities: day.activities.map(act =>
            act.id === activityId ? { ...act, completed: !act.completed } : act
          ),
        };
      }
      return day;
    });
    onUpdateItinerary(updated);
  };

  const handleAddActivity = (dayNum: number) => {
    if (!newTitle.trim()) return;

    const newActivity: Activity = {
      id: Math.random().toString(36).substring(2, 9),
      timeOfDay: newTime,
      title: newTitle.trim(),
      description: newDesc.trim() || 'No description provided.',
      location: newLoc.trim() || 'Unknown',
      estimatedCost: newCost,
      transportTip: newTransit.trim() || 'Walk or taxi.',
      completed: false,
    };

    const updated = itinerary.map(day => {
      if (day.dayNumber === dayNum) {
        return {
          ...day,
          activities: [...day.activities, newActivity].sort((a, b) => {
            const order = { Morning: 0, Afternoon: 1, Evening: 2 };
            return order[a.timeOfDay] - order[b.timeOfDay];
          }),
        };
      }
      return day;
    });

    onUpdateItinerary(updated);
    resetForm();
  };

  const handleDeleteActivity = (dayNum: number, activityId: string) => {
    const updated = itinerary.map(day => {
      if (day.dayNumber === dayNum) {
        return {
          ...day,
          activities: day.activities.filter(act => act.id !== activityId),
        };
      }
      return day;
    });
    onUpdateItinerary(updated);
    if (selectedActivityId === activityId) {
      setSelectedActivityId(null);
    }
  };

  const resetForm = () => {
    setAddingToDay(null);
    setNewTitle('');
    setNewDesc('');
    setNewLoc('');
    setNewCost(0);
    setNewTime('Morning');
    setNewTransit('');
  };

  const getTimeIcon = (time: 'Morning' | 'Afternoon' | 'Evening') => {
    switch (time) {
      case 'Morning': return '☀️';
      case 'Afternoon': return '🌤️';
      case 'Evening': return '🌙';
    }
  };

  const getTimeBg = (time: 'Morning' | 'Afternoon' | 'Evening') => {
    switch (time) {
      case 'Morning': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Afternoon': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Evening': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  // Extract the activities of the currently active day for the dashboard
  const activeDay = itinerary.find(d => d.dayNumber === selectedDayNum) || itinerary[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Timeline */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4 text-left">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-800">Day-by-Day Timeline</h2>
            <p className="text-xs text-slate-500">Expand days to organize, add specific activities, and track daily schedules.</p>
          </div>
          <div className="flex gap-2 text-xs shrink-0">
            <button
              onClick={() => setExpandedDays(itinerary.map(d => d.dayNumber))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold transition-all"
            >
              Expand All
            </button>
            <button
              onClick={() => setExpandedDays([1])}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold transition-all"
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {itinerary.map(day => {
            const isExpanded = expandedDays.includes(day.dayNumber);
            const completedCount = day.activities.filter(a => a.completed).length;
            const totalCount = day.activities.length;
            const isSelectedDay = selectedDayNum === day.dayNumber;

            return (
              <div
                key={day.dayNumber}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  isSelectedDay ? 'border-teal-400 ring-2 ring-teal-500/5 shadow-md' : 'border-slate-100 shadow-sm'
                }`}
              >
                {/* Day Header */}
                <div
                  onClick={() => toggleDay(day.dayNumber)}
                  className={`flex items-center justify-between p-5 cursor-pointer border-b border-slate-100 transition-all select-none ${
                    isSelectedDay ? 'bg-teal-50/10' : 'bg-slate-50/30 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-display shadow-sm font-bold transition-all ${
                      isSelectedDay ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      <span className="text-[10px] leading-none uppercase tracking-wider font-semibold opacity-85">Day</span>
                      <span className="text-base leading-none mt-0.5">{day.dayNumber}</span>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-slate-800 leading-snug">{day.dayTitle}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {totalCount} {totalCount === 1 ? 'activity' : 'activities'}
                        </span>
                        {totalCount > 0 && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal-500 transition-all duration-300"
                                style={{ width: `${(completedCount / totalCount) * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-teal-600 font-bold font-mono">
                              {completedCount}/{totalCount} Done
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Day Details */}
                {isExpanded && (
                  <div className="p-5 space-y-6 relative">
                    {day.activities.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-sm font-semibold text-slate-700">No activities scheduled</p>
                        <p className="text-xs text-slate-500 mt-1">Add custom sights or meals to organize your day.</p>
                      </div>
                    ) : (
                      <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                        {day.activities.map((act) => {
                          const isSelectedActivity = selectedActivityId === act.id;
                          return (
                            <div
                              key={act.id}
                              onClick={() => {
                                setSelectedActivityId(act.id);
                                setSelectedDayNum(day.dayNumber);
                              }}
                              className={`relative group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer text-left ${
                                isSelectedActivity
                                  ? 'border-indigo-500 ring-2 ring-indigo-500/10 shadow-md scale-[0.99]'
                                  : act.completed
                                  ? 'bg-slate-50/50 border-slate-100 opacity-75'
                                  : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                              }`}
                            >
                              {/* Timeline bullet */}
                              <div className="absolute -left-[27px] top-[18px] z-10" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleToggleActivityCompleted(day.dayNumber, act.id)}
                                  className={`w-[14px] h-[14px] rounded-full border-2 transition-all ${
                                    act.completed
                                      ? 'bg-teal-600 border-teal-600 shadow-sm scale-110'
                                      : 'bg-white border-slate-300 hover:border-teal-500'
                                  }`}
                                  title={act.completed ? 'Mark as incomplete' : 'Mark as completed'}
                                />
                              </div>

                              {/* Time Indicator */}
                              <div className={`shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-bold leading-none ${getTimeBg(act.timeOfDay)}`}>
                                <span>{getTimeIcon(act.timeOfDay)}</span>
                                <span className="hidden sm:inline">{act.timeOfDay}</span>
                              </div>

                              {/* Activity Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className={`font-display font-semibold text-sm sm:text-base ${act.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                    {act.title}
                                  </h4>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteActivity(day.dayNumber, act.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all shrink-0"
                                    title="Delete activity"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                                  {act.description}
                                </p>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 pt-2.5 border-t border-slate-100">
                                  {act.location && (
                                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                      <span className="font-medium text-slate-600">{act.location}</span>
                                    </span>
                                  )}
                                  {act.transportTip && (
                                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                      <Bus className="w-3.5 h-3.5 text-slate-400" />
                                      <span className="text-slate-600">{act.transportTip}</span>
                                    </span>
                                  )}
                                  {act.estimatedCost !== undefined && (
                                    <span className={`text-[11px] font-semibold font-mono ml-auto px-2 py-0.5 rounded ${
                                      act.estimatedCost === 0
                                        ? 'bg-slate-100 text-slate-600'
                                        : 'bg-teal-50 text-teal-600'
                                    }`}>
                                      {act.estimatedCost === 0 ? (
                                        /train|railway|express|flight|bus|transit|drive|journey|shuttle|cab|taxi|metro|ferry|transfer/i.test(act.title + ' ' + act.description)
                                          ? 'Included in Transport'
                                          : 'Free Entry'
                                      ) : (
                                        formatCurrency(act.estimatedCost, homeCurrency)
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Inline Action Form Trigger */}
                    {addingToDay !== day.dayNumber ? (
                      <button
                        onClick={() => setAddingToDay(day.dayNumber)}
                        className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-teal-700 rounded-xl font-medium border border-slate-150 flex items-center justify-center gap-1.5 text-xs transition-all"
                      >
                        <Plus className="w-4 h-4" /> Add Custom Activity to Day {day.dayNumber}
                      </button>
                    ) : (
                      <div className="bg-slate-50 rounded-2xl border border-slate-250/60 p-4 space-y-4 text-left">
                        <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">New Activity Details</h4>
                          <button onClick={resetForm} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[11px] font-bold text-slate-500">Activity Title *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Visit local sushi market"
                              value={newTitle}
                              onChange={e => setNewTitle(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500">Time of Day</label>
                            <select
                              value={newTime}
                              onChange={e => setNewTime(e.target.value as any)}
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700 font-sans"
                            >
                              <option value="Morning">☀️ Morning</option>
                              <option value="Afternoon">🌤️ Afternoon</option>
                              <option value="Evening">🌙 Evening</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500">Short Description</label>
                          <input
                            type="text"
                            placeholder="e.g. Taste fresh salmon sashimi at stalls."
                            value={newDesc}
                            onChange={e => setNewDesc(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500">Location</label>
                            <input
                              type="text"
                              placeholder="e.g. Tsukiji Outer Market"
                              value={newLoc}
                              onChange={e => setNewLoc(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500">Transit/Directions Tip</label>
                            <input
                              type="text"
                              placeholder="e.g. Subway Hibiya Line to Tsukiji"
                              value={newTransit}
                              onChange={e => setNewTransit(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500">Est. Cost ({homeCurrency || 'USD'})</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="e.g. 15"
                              value={newCost || ''}
                              onChange={e => setNewCost(Number(e.target.value))}
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/50">
                          <button
                            type="button"
                            onClick={resetForm}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-200 rounded-lg hover:bg-slate-300 transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddActivity(day.dayNumber)}
                            disabled={!newTitle.trim()}
                            className={`px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-all ${
                              newTitle.trim() ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-300 cursor-not-allowed'
                            }`}
                          >
                            Add Activity
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Floating/Sticky Day Companion Dashboard */}
      <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20 space-y-5 text-left">
        
        {/* Daily Schedule Tracker */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-50">
            <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-800 text-sm">Day {selectedDayNum} Companion</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Real-time goals and activity progress tracker</p>
            </div>
          </div>

          {activeDay && activeDay.activities.length > 0 ? (
            <div className="space-y-3">
              {/* Progress calculation */}
              {(() => {
                const total = activeDay.activities.length;
                const completed = activeDay.activities.filter(a => a.completed).length;
                const percentage = Math.round((completed / total) * 100);
                return (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Daily Progression</span>
                      <span className="font-mono text-teal-600 font-bold">{completed}/{total} Completed</span>
                    </div>
                    {/* Linear Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-teal-500 h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {percentage === 100 
                        ? "🎉 Fantastic job! You've accomplished every goal scheduled for today!" 
                        : percentage > 0 
                          ? `Keep exploring! You have completed ${percentage}% of your activities.` 
                          : "Tap checkboxes on the left as you explore landmarks and stops."}
                    </p>
                  </div>
                );
              })()}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No activities scheduled for this day yet. Use the timeline editor to add some!</p>
          )}
        </div>

        {/* Local Phrases & Survival Dictionary */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-50">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-800 text-sm">Essential Translator</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Phonetic pronunciations for local communication</p>
            </div>
          </div>

          {localTips?.phrases && localTips.phrases.length > 0 ? (
            <div className="space-y-2.5">
              {localTips.phrases.map((phrase, idx) => (
                <div 
                  key={idx} 
                  className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl transition-all group flex items-start justify-between gap-2"
                >
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide font-mono">
                      "{phrase.english}"
                    </span>
                    <span className="block text-xs font-bold text-slate-800 font-display">
                      {phrase.local}
                    </span>
                  </div>
                  <button 
                    title="Tap to phonetic repeat"
                    className="p-1 text-slate-400 group-hover:text-indigo-600 rounded hover:bg-white transition-all shrink-0"
                    onClick={() => {
                      // Small audio click effect or visual hint
                      const speech = new SpeechSynthesisUtterance(phrase.local);
                      speech.lang = 'en-US'; // basic speech synth
                      try {
                        window.speechSynthesis.speak(speech);
                      } catch (e) {
                        console.log("SpeechSynthesis not supported on this container browser frame");
                      }
                    }}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {[
                { english: 'Hello / Good morning', local: 'Bonjour (bohn-zhoor)' },
                { english: 'Thank you very much', local: 'Merci beaucoup (mair-see boh-coo)' },
                { english: 'Where is the station?', local: 'Où est la gare? (oo ay lah gahr)' },
                { english: 'How much is this?', local: 'Combien ça coûte? (cohm-byen sah coot)' }
              ].map((phrase, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400">"{phrase.english}"</span>
                    <span className="block text-xs font-bold text-slate-800">{phrase.local}</span>
                  </div>
                  <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Local Weather & Safety Alert Quick Widget */}
        {(localTips?.weather || localTips?.safety) && (
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-50">
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-slate-800 text-sm">Destination Briefing</h3>
            </div>
            
            {localTips.weather && (
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Weather Alert Info</span>
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans">{localTips.weather}</p>
              </div>
            )}

            {localTips.safety && (
              <div className="space-y-1 pt-1 border-t border-slate-50">
                <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Scam & safety guidance</span>
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans">{localTips.safety}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
