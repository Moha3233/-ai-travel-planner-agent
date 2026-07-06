import React, { useState } from 'react';
import { MapPin, Calendar, DollarSign, Sparkles, Compass, Check, Navigation, Users, Minus, Plus } from 'lucide-react';
import { TripPreferences } from '../types';

interface TripFormProps {
  onGenerate: (preferences: TripPreferences) => void;
  isLoading: boolean;
}

const STYLE_OPTIONS = [
  { id: 'Adventure', label: '🧗 Adventure', description: 'Hiking, sports, outdoors' },
  { id: 'Culture', label: '🏛️ Culture & History', description: 'Museums, landmarks, tours' },
  { id: 'Food', label: '🍳 Food & Culinary', description: 'Local cuisine, dining, tasting' },
  { id: 'Nature', label: '🌲 Nature & Wildlife', description: 'Parks, beaches, scenic views' },
  { id: 'Relaxing', label: '🧘 Relaxing & Wellness', description: 'Spas, slow paces, beaches' },
  { id: 'Shopping', label: '🛍️ Shopping', description: 'Markets, malls, souvenirs' },
  { id: 'Solo', label: '🚶 Solo-friendly', description: 'Safe, easy to navigate, social' },
  { id: 'Family', label: '👨‍👩‍👧‍👦 Family-oriented', description: 'Kid-friendly, safe, diverse' },
  { id: 'Couple', label: '💑 Romantic', description: 'Cozy spots, intimate dinners' },
  { id: 'Luxury', label: '✨ Luxury & Premium', description: 'Fine dining, upscale sights' },
];

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
];

export default function TripForm({ onGenerate, isLoading }: TripFormProps) {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetLimit, setBudgetLimit] = useState(1500);
  const [budgetTier, setBudgetTier] = useState<'budget' | 'moderate' | 'luxury'>('moderate');
  const [homeCurrency, setHomeCurrency] = useState('USD');
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['Culture', 'Food']);
  const [specialPreferences, setSpecialPreferences] = useState('');
  const [travelersCount, setTravelersCount] = useState<number>(1);

  const toggleStyle = (id: string) => {
    setSelectedStyles(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 3; // Default 3 days if dates not set
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 3;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;

    onGenerate({
      source: source.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      durationDays: calculateDays(),
      budgetLimit,
      budgetTier,
      travelStyle: selectedStyles,
      specialPreferences: specialPreferences.trim(),
      homeCurrency,
      travelersCount,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-t-4 border-t-teal-600 border-x border-b border-slate-100 shadow-md shadow-slate-100/80 p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-2">
        <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
          <Compass className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-slate-800 tracking-tight">Customize Your Journey</h2>
          <p className="text-xs text-slate-500">Provide details to generate a custom day-by-day travel plan.</p>
        </div>
      </div>

      {/* Source & Destination */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="source" className="block text-sm font-medium text-slate-700">
            Where are you starting from?
          </label>
          <div className="relative">
            <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 -rotate-45" />
            <input
              id="source"
              type="text"
              required
              placeholder="e.g. New York, USA or London, UK"
              value={source}
              onChange={e => setSource(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 placeholder-slate-400 font-sans transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="destination" className="block text-sm font-medium text-slate-700">
            Where would you like to go?
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              id="destination"
              type="text"
              required
              placeholder="e.g. Kyoto, Japan or Paris, France"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 placeholder-slate-400 font-sans transition-all"
            />
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">
            Start Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-sans transition-all"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">
            End Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-sans transition-all"
            />
          </div>
        </div>
      </div>

      {/* Number of Travelers */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Number of Members Travelling
        </label>
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-150 rounded-xl p-3 md:p-3.5 w-full sm:w-72">
          <div className="p-2 bg-white text-teal-600 rounded-lg shadow-sm border border-slate-100">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Travelers</span>
            <span className="text-sm font-bold text-slate-800 font-mono">
              {travelersCount} {travelersCount === 1 ? 'Member' : 'Members'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTravelersCount(prev => Math.max(1, prev - 1))}
              disabled={travelersCount <= 1}
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-sm"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setTravelersCount(prev => Math.min(20, prev + 1))}
              disabled={travelersCount >= 20}
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Budget Limit & Tier */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Budget Tier & Estimate
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['budget', 'moderate', 'luxury'] as const).map(tier => (
              <button
                key={tier}
                type="button"
                onClick={() => {
                  setBudgetTier(tier);
                  // Auto-adjust default budget limits for convenience
                  if (tier === 'budget') setBudgetLimit(800);
                  else if (tier === 'moderate') setBudgetLimit(2000);
                  else setBudgetLimit(5000);
                }}
                className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all text-center capitalize ${
                  budgetTier === tier
                    ? 'border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-500/10'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="budgetLimit" className="block text-sm font-medium text-slate-700">
              Max Total Budget
            </label>
            <span className="text-sm font-bold text-teal-600 font-mono">
              {CURRENCIES.find(c => c.code === homeCurrency)?.symbol || '$'}{budgetLimit.toLocaleString()} {homeCurrency}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 font-bold text-sm font-mono">
                {CURRENCIES.find(c => c.code === homeCurrency)?.symbol || '$'}
              </span>
              <input
                id="budgetLimit"
                type="number"
                min="100"
                max="100000"
                step="50"
                value={budgetLimit}
                onChange={e => setBudgetLimit(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-sans font-medium transition-all"
              />
            </div>

            <div className="relative flex items-center">
              <select
                value={homeCurrency}
                onChange={e => setHomeCurrency(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-sans font-semibold bg-white appearance-none cursor-pointer text-sm"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <input
            type="range"
            min={budgetTier === 'budget' ? '100' : budgetTier === 'moderate' ? '1000' : '3000'}
            max={budgetTier === 'budget' ? '1500' : budgetTier === 'moderate' ? '5000' : '20000'}
            step="100"
            value={budgetLimit}
            onChange={e => setBudgetLimit(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Travel Styles Checkboxes */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          Travel Styles & Vibe <span className="text-xs text-slate-400 font-normal">(Select multiple)</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {STYLE_OPTIONS.map(style => {
            const isSelected = selectedStyles.includes(style.id);
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => toggleStyle(style.id)}
                className={`flex items-start text-left p-2.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50/50 ring-1 ring-teal-500'
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border mt-0.5 mr-2.5 transition-all ${
                  isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white border-slate-300'
                }`}>
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">{style.label}</div>
                  <div className="text-[10px] text-slate-500 leading-tight">{style.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Special Preferences */}
      <div className="space-y-2">
        <label htmlFor="specialPreferences" className="block text-sm font-medium text-slate-700">
          Any Special Requests / Preferences?
        </label>
        <textarea
          id="specialPreferences"
          rows={3}
          placeholder="e.g. Dietary constraints, physical accessibility requirements, traveling with pets, specific sightseeing wishes, local festivals, etc."
          value={specialPreferences}
          onChange={e => setSpecialPreferences(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 placeholder-slate-400 font-sans transition-all text-sm resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !destination.trim()}
        className={`w-full py-3.5 px-6 rounded-xl font-display font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-sm ${
          isLoading || !destination.trim()
            ? 'bg-slate-300 cursor-not-allowed shadow-none'
            : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 hover:shadow-md active:scale-[0.99]'
        }`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Generating Travel Plan with AI...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate My Custom Itinerary
          </>
        )}
      </button>
    </form>
  );
}
