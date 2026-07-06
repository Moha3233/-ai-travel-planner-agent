/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Sparkles, 
  Calendar, 
  MapPin, 
  DollarSign, 
  FolderOpen, 
  CheckSquare, 
  Plane, 
  Building, 
  Eye, 
  Languages, 
  AlertCircle, 
  Check, 
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

import { TripPlan, TripPreferences, CustomExpense, DayItinerary } from './types';
import TripForm from './components/TripForm';
import ItineraryView from './components/ItineraryView';
import AccommodationsView from './components/AccommodationsView';
import BudgetPlanner from './components/BudgetPlanner';
import AttractionsView from './components/AttractionsView';
import SavedTrips from './components/SavedTrips';
import LocalTipsView from './components/LocalTipsView';
import { DEFAULT_USD_RATES, getCrossRate, formatCurrency } from './utils';

// @ts-ignore
import compassLogo from './assets/images/compass_logo_1783311991242.jpg';

const LOADING_MESSAGES = [
  "Consulting local guides and weather models...",
  "Searching flight routes and typical rates...",
  "Selecting comfortable stays matching your budget...",
  "Mapping optimal geographic paths for sightseeing...",
  "Sourcing local restaurants and street food hotspots...",
  "Compiling local language cheat sheets for you...",
  "Polishing your personalized dream travel itinerary..."
];

export default function App() {
  const [savedPlans, setSavedPlans] = useState<TripPlan[]>([]);
  const [activePlan, setActivePlan] = useState<TripPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'plan' | 'itinerary' | 'accommodations' | 'budget' | 'attractions' | 'local' | 'saved'>('plan');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load plans from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ai_travel_plans');
      if (stored) {
        const parsed = JSON.parse(stored) as TripPlan[];
        setSavedPlans(parsed);
        // Load the last active plan if present
        const lastActiveId = localStorage.getItem('ai_travel_active_id');
        if (lastActiveId) {
          const matched = parsed.find(p => p.id === lastActiveId);
          if (matched) {
            setActivePlan(matched);
            setActiveTab('itinerary');
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse saved plans", e);
    }
  }, []);

  // Save plans to local storage whenever they change
  const savePlansToStorage = (plans: TripPlan[]) => {
    localStorage.setItem('ai_travel_plans', JSON.stringify(plans));
    setSavedPlans(plans);
  };

  // Loading message rotation interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Handle plan generation from API
  const handleGenerateTrip = async (preferences: TripPreferences) => {
    setIsLoading(true);
    setLoadingMsgIdx(0);
    setError(null);

    try {
      const homeCode = preferences.homeCurrency || 'USD';
      const usdToHomeRate = DEFAULT_USD_RATES[homeCode] || 1.0;

      // Convert home-currency budget limit to USD for the AI concierge
      const usdBudgetLimit = Math.round(preferences.budgetLimit / usdToHomeRate);

      const response = await fetch('/api/generate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...preferences,
          budgetLimit: usdBudgetLimit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate your trip plan. Please try again.");
      }

      // Calculate home to local cross-exchange rate
      const localCode = data.localCurrencyCode || 'USD';
      const usdToLocalRate = data.typicalExchangeRate || 1.0;
      const finalExchangeRate = getCrossRate(homeCode, localCode, usdToLocalRate);

      // Convert AI USD values back to home currency (e.g. INR)
      const convertedBreakdown = {
        estimatedFlights: Math.round((data.budgetBreakdown?.estimatedFlights || 0) * usdToHomeRate),
        estimatedHotels: Math.round((data.budgetBreakdown?.estimatedHotels || 0) * usdToHomeRate),
        estimatedFood: Math.round((data.budgetBreakdown?.estimatedFood || 0) * usdToHomeRate),
        estimatedActivities: Math.round((data.budgetBreakdown?.estimatedActivities || 0) * usdToHomeRate),
        estimatedTransport: Math.round((data.budgetBreakdown?.estimatedTransport || 0) * usdToHomeRate),
        estimatedEmergency: Math.round((data.budgetBreakdown?.estimatedEmergency || 0) * usdToHomeRate),
      };

      // Prevent minor rounding drift from pushing the sum over the specified budget limit
      const usdTotalSum =
        (data.budgetBreakdown?.estimatedFlights || 0) +
        (data.budgetBreakdown?.estimatedHotels || 0) +
        (data.budgetBreakdown?.estimatedFood || 0) +
        (data.budgetBreakdown?.estimatedActivities || 0) +
        (data.budgetBreakdown?.estimatedTransport || 0) +
        (data.budgetBreakdown?.estimatedEmergency || 0);

      const sumConverted =
        convertedBreakdown.estimatedFlights +
        convertedBreakdown.estimatedHotels +
        convertedBreakdown.estimatedFood +
        convertedBreakdown.estimatedActivities +
        convertedBreakdown.estimatedTransport +
        convertedBreakdown.estimatedEmergency;

      const maxAllowedSum = preferences.budgetLimit;

      if (sumConverted > maxAllowedSum) {
        let diff = sumConverted - maxAllowedSum;
        // First try to deduct from the emergency fund
        if (convertedBreakdown.estimatedEmergency >= diff) {
          convertedBreakdown.estimatedEmergency -= diff;
        } else {
          diff -= convertedBreakdown.estimatedEmergency;
          convertedBreakdown.estimatedEmergency = 0;
          // Deduct from other categories sequentially
          const keys = [
            'estimatedFood',
            'estimatedActivities',
            'estimatedTransport',
            'estimatedHotels',
            'estimatedFlights'
          ] as const;
          for (const key of keys) {
            if (diff <= 0) break;
            const val = convertedBreakdown[key];
            if (val >= diff) {
              convertedBreakdown[key] -= diff;
              diff = 0;
            } else {
              diff -= val;
              convertedBreakdown[key] = 0;
            }
          }
        }
      }

      const convertedFlights = (data.flights || []).map((flight: any) => ({
        ...flight,
        typicalPrice: Math.round((flight.typicalPrice || 0) * usdToHomeRate),
      }));

      const convertedHotels = (data.hotels || []).map((hotel: any) => ({
        ...hotel,
        pricePerNight: Math.round((hotel.pricePerNight || 0) * usdToHomeRate),
      }));

      const convertedItinerary = (data.itinerary || []).map((day: any) => ({
        ...day,
        activities: (day.activities || []).map((act: any) => ({
          ...act,
          id: Math.random().toString(36).substring(2, 9),
          completed: false,
          estimatedCost: Math.round((act.estimatedCost || 0) * usdToHomeRate),
        })),
      }));

      const convertedAttractions = (data.attractions || []).map((attraction: any) => ({
        ...attraction,
        cost: Math.round((attraction.cost || 0) * usdToHomeRate),
      }));

      // Add a client-side unique ID and default structures
      const newPlan: TripPlan = {
        id: Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString(),
        preferences: {
          ...preferences,
          homeCurrency: homeCode,
          localCurrency: localCode,
          exchangeRate: finalExchangeRate,
        },
        summary: data.summary || '',
        budgetBreakdown: convertedBreakdown,
        flights: convertedFlights,
        hotels: convertedHotels,
        itinerary: convertedItinerary,
        attractions: convertedAttractions,
        localTips: data.localTips,
        notes: '',
        customExpenses: [],
        localCurrencyCode: localCode,
        typicalExchangeRate: usdToLocalRate,
        budgetAdvice: data.budgetAdvice,
        travelNews: data.travelNews || [],
      };

      const updatedPlans = [newPlan, ...savedPlans];
      savePlansToStorage(updatedPlans);
      setActivePlan(newPlan);
      localStorage.setItem('ai_travel_active_id', newPlan.id);
      setActiveTab('itinerary');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong while planning your trip. Check your API key or connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Load a saved plan
  const handleLoadPlan = (plan: TripPlan) => {
    setActivePlan(plan);
    localStorage.setItem('ai_travel_active_id', plan.id);
    setActiveTab('itinerary');
    setError(null);
  };

  // Delete a plan
  const handleDeletePlan = (id: string) => {
    const updated = savedPlans.filter(p => p.id !== id);
    savePlansToStorage(updated);
    if (activePlan?.id === id) {
      setActivePlan(null);
      localStorage.removeItem('ai_travel_active_id');
      setActiveTab('plan');
    }
  };

  // Rename a plan's destination/custom title
  const handleRenamePlan = (id: string, newName: string) => {
    const updated = savedPlans.map(p => {
      if (p.id === id) {
        return {
          ...p,
          preferences: { ...p.preferences, destination: newName }
        };
      }
      return p;
    });
    savePlansToStorage(updated);
    if (activePlan?.id === id) {
      setActivePlan(prev => prev ? { ...prev, preferences: { ...prev.preferences, destination: newName } } : null);
    }
  };

  // Update specific features inside the active plan
  const updateActivePlan = (updatedFields: Partial<TripPlan>) => {
    if (!activePlan) return;

    const modifiedPlan = {
      ...activePlan,
      ...updatedFields,
    };

    setActivePlan(modifiedPlan);

    const updatedPlans = savedPlans.map(p => p.id === activePlan.id ? modifiedPlan : p);
    savePlansToStorage(updatedPlans);
  };

  // Tab configurations
  const isTripAvailable = !!activePlan;

  return (
    <div className="min-h-screen bg-slate-50/70 bg-grid-pattern flex flex-col font-sans antialiased text-slate-800 relative overflow-x-hidden">
      {/* Premium ambient decorative blurred glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-200/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-200/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-emerald-100/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Dynamic Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md shadow-slate-200 border border-slate-100/80 hover:scale-105 hover:rotate-3 transition-all duration-300 group cursor-pointer bg-slate-50 flex items-center justify-center p-0.5">
              <img 
                src={compassLogo} 
                alt="Golden Compass Logo" 
                className="w-full h-full object-contain rounded-lg group-hover:rotate-12 transition-transform duration-500" 
                referrerPolicy="no-referrer" 
              />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-lg sm:text-xl text-slate-800 tracking-tight flex items-center gap-1.5 leading-none">
                AI Travel Planner <span className="text-xs font-bold font-sans text-teal-600 bg-teal-50 border border-teal-100 rounded-full px-2 py-0.5 mt-0.5">Agent</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">Intelligent trip designer & budget advisor</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold font-sans transition-all flex items-center gap-1.5 ${
                activeTab === 'saved'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              My Trips
              {savedPlans.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                  {savedPlans.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* API Error Box */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3.5 items-start">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-grow">
              <h3 className="font-display font-bold text-red-800 text-sm">Failed to generate itinerary</h3>
              <p className="text-xs text-red-700 mt-1 leading-relaxed">
                {error}
              </p>
              <p className="text-xs text-red-600/80 mt-2 font-medium">
                Tip: Ensure your server is active and the GEMINI_API_KEY secret is filled out via top-right Secrets.
              </p>
            </div>
          </div>
        )}

        {/* Current Active Trip Overview Summary (Collapsible/Context block) */}
        {activePlan && activeTab !== 'plan' && activeTab !== 'saved' && (
          <div className="bg-gradient-to-r from-teal-800 to-emerald-900 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-teal-950/10 flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden text-left">
            {/* Ambient visual glow */}
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-3.5 max-w-2xl relative z-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-700/60 border border-emerald-600/30 rounded-full px-2.5 py-0.5 leading-none">
                  Currently viewing
                </span>
                {activePlan.preferences.travelStyle && activePlan.preferences.travelStyle.slice(0, 2).map((style, i) => (
                  <span key={i} className="text-[10px] font-bold bg-white/10 rounded-full px-2 py-0.5 leading-none">
                    {style}
                  </span>
                ))}
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl leading-tight tracking-tight">
                {activePlan.preferences.source ? `${activePlan.preferences.source} ➔ ` : ''}{activePlan.preferences.destination}
              </h2>
              <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed max-w-xl font-sans italic">
                "{activePlan.summary}"
              </p>
            </div>

            <div className="flex flex-wrap md:flex-col justify-start md:justify-center items-start gap-4 md:gap-3 border-t md:border-t-0 md:border-l border-white/15 pt-5 md:pt-0 md:pl-8 shrink-0 min-w-[200px] font-sans text-left">
              <div className="space-y-0.5">
                <span className="text-[10px] text-teal-200 uppercase font-bold tracking-wider">Planned Dates</span>
                <span className="block text-sm font-bold text-white font-mono">
                  {activePlan.preferences.startDate ? (
                    new Date(activePlan.preferences.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                  ) : (
                    `${activePlan.preferences.durationDays} Days Duration`
                  )}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-teal-200 uppercase font-bold tracking-wider">Group Size</span>
                <span className="block text-sm font-bold text-white font-mono">
                  {activePlan.preferences.travelersCount || 1} {(activePlan.preferences.travelersCount || 1) === 1 ? 'Traveler' : 'Travelers'}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-teal-200 uppercase font-bold tracking-wider">Total budget limit</span>
                <span className="block text-sm font-bold text-white font-mono">
                  {formatCurrency(activePlan.preferences.budgetLimit, activePlan.preferences.homeCurrency)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Loading overlay panel */}
        {isLoading ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm max-w-xl mx-auto space-y-8 py-16 animate-pulse">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute w-full h-full rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin" />
              <Compass className="w-10 h-10 text-teal-600 animate-bounce" />
            </div>
            
            <div className="space-y-3">
              <h3 className="font-display font-bold text-slate-800 text-lg">Plotting Your Perfect Journey...</h3>
              <p className="text-xs sm:text-sm text-teal-600 font-semibold font-mono animate-fade-in bg-teal-50/50 px-3 py-1 rounded-full max-w-max mx-auto">
                {LOADING_MESSAGES[loadingMsgIdx]}
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed pt-2">
                This takes a brief moment. Gemini is preparing day-by-day itineraries, flight estimates, hotel recommendations, and packing lists.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* View navigation Tabs */}
            <div className="bg-slate-100/70 border border-slate-200/40 p-1.5 rounded-2xl flex overflow-x-auto scrollbar-hide gap-1.5 select-none shadow-sm w-full max-w-max mx-auto sm:mx-0">
              <button
                onClick={() => setActiveTab('plan')}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-display tracking-tight flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  activeTab === 'plan'
                    ? 'bg-white text-teal-700 shadow-sm border border-slate-200/60 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                <Compass className="w-4 h-4" />
                Plan Trip
              </button>

              {isTripAvailable && (
                <>
                  <button
                    onClick={() => setActiveTab('itinerary')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-display tracking-tight flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                      activeTab === 'itinerary'
                        ? 'bg-white text-teal-700 shadow-sm border border-slate-200/60 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    Itinerary
                  </button>
                  <button
                    onClick={() => setActiveTab('accommodations')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-display tracking-tight flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                      activeTab === 'accommodations'
                        ? 'bg-white text-teal-700 shadow-sm border border-slate-200/60 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    Stays & Flights
                  </button>
                  <button
                    onClick={() => setActiveTab('budget')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-display tracking-tight flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                      activeTab === 'budget'
                        ? 'bg-white text-teal-700 shadow-sm border border-slate-200/60 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    Budget Tracker
                  </button>
                  <button
                    onClick={() => setActiveTab('attractions')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-display tracking-tight flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                      activeTab === 'attractions'
                        ? 'bg-white text-teal-700 shadow-sm border border-slate-200/60 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    Attractions & Notes
                  </button>
                  <button
                    onClick={() => setActiveTab('local')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-display tracking-tight flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                      activeTab === 'local'
                        ? 'bg-white text-teal-700 shadow-sm border border-slate-200/60 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                    }`}
                  >
                    <Languages className="w-4 h-4" />
                    Local Tips
                  </button>
                </>
              )}
            </div>

            {/* Display correct sub-panel */}
            <div className="transition-all duration-200">
              {activeTab === 'plan' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-7">
                    <TripForm onGenerate={handleGenerateTrip} isLoading={isLoading} />
                  </div>
                  <div className="lg:col-span-5 space-y-6">
                    {/* Concise Help Cards */}
                    <div className="bg-gradient-to-b from-indigo-900 to-slate-900 text-white p-6 rounded-2xl border border-indigo-950 shadow-lg relative overflow-hidden">
                      <div className="absolute right-0 bottom-0 opacity-10 select-none">
                        <Compass className="w-44 h-44" />
                      </div>
                      <div className="relative z-10 space-y-4">
                        <span className="text-[9px] font-extrabold uppercase tracking-widest bg-indigo-500/20 border border-indigo-400/20 rounded px-2 py-0.5">
                          How it works
                        </span>
                        <h3 className="font-display font-extrabold text-lg sm:text-xl tracking-tight leading-snug">Instant Custom Concierge</h3>
                        <p className="text-xs text-indigo-200 font-sans leading-relaxed">
                          Rather than searching across a dozen web logs, describe your parameters. Our AI instantly prepares customized:
                        </p>
                        <ul className="text-xs text-indigo-100/90 space-y-2 font-sans">
                          <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Day-by-day sightseeing timeline</li>
                          <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Local hotel suggestions & typical flight rates</li>
                          <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Packing essential tips, safety traps & translator</li>
                        </ul>
                      </div>
                    </div>

                    {/* Quick Saved Link if existing */}
                    {savedPlans.length > 0 && (
                      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3.5">
                        <h4 className="font-display font-bold text-slate-800 text-sm flex items-center gap-2">
                          <FolderOpen className="w-4 h-4 text-indigo-500" />
                          Reload Previous Journey
                        </h4>
                        <div className="space-y-2.5">
                          {savedPlans.slice(0, 3).map(plan => (
                            <button
                              key={plan.id}
                              onClick={() => handleLoadPlan(plan)}
                              className="w-full p-2.5 text-left border border-slate-100 hover:border-slate-200 rounded-xl flex items-center justify-between text-xs transition-all group hover:bg-slate-50/50"
                            >
                              <div>
                                <span className="font-bold text-slate-800 group-hover:text-teal-700">{plan.preferences.destination}</span>
                                <span className="block text-[10px] text-slate-400 mt-0.5">{plan.preferences.durationDays} Days • {plan.preferences.budgetTier}</span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 transition-all transform group-hover:translate-x-1" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'itinerary' && activePlan && (
                <ItineraryView
                  itinerary={activePlan.itinerary}
                  onUpdateItinerary={updatedItinerary => updateActivePlan({ itinerary: updatedItinerary })}
                  homeCurrency={activePlan.preferences.homeCurrency}
                  destination={activePlan.preferences.destination}
                  localTips={activePlan.localTips}
                  travelNews={activePlan.travelNews}
                />
              )}

              {activeTab === 'accommodations' && activePlan && (
                <AccommodationsView
                  flights={activePlan.flights}
                  hotels={activePlan.hotels}
                  homeCurrency={activePlan.preferences.homeCurrency}
                  destination={activePlan.preferences.destination}
                  travelNews={activePlan.travelNews}
                />
              )}

              {activeTab === 'budget' && activePlan && (
                <BudgetPlanner
                  preferences={activePlan.preferences}
                  breakdown={activePlan.budgetBreakdown}
                  customExpenses={activePlan.customExpenses}
                  onUpdateExpenses={updatedExpenses => updateActivePlan({ customExpenses: updatedExpenses })}
                  onUpdatePreferences={updatedPrefs => updateActivePlan({ preferences: updatedPrefs })}
                  budgetAdvice={activePlan.budgetAdvice}
                />
              )}

              {activeTab === 'attractions' && activePlan && (
                <AttractionsView
                  attractions={activePlan.attractions}
                  notes={activePlan.notes}
                  onUpdateNotes={updatedNotes => updateActivePlan({ notes: updatedNotes })}
                  homeCurrency={activePlan.preferences.homeCurrency}
                />
              )}

              {activeTab === 'local' && activePlan && (
                <LocalTipsView tips={activePlan.localTips} />
              )}

              {activeTab === 'saved' && (
                <SavedTrips
                  savedPlans={savedPlans}
                  activeTripId={activePlan?.id || null}
                  onLoadPlan={handleLoadPlan}
                  onDeletePlan={handleDeletePlan}
                  onRenamePlan={handleRenamePlan}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Elegant minimalist footer */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 text-center text-xs text-slate-400 select-none">
        <p className="font-sans font-medium">© 2026 AI Travel Planner Agent. Made with Google AI Studio Build.</p>
      </footer>
    </div>
  );
}
