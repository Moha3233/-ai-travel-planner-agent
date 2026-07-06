import React, { useState } from 'react';
import { DollarSign, Plus, Trash2, Check, ShieldAlert, Coins, RefreshCw, Edit2, X, Users } from 'lucide-react';
import { BudgetBreakdown, CustomExpense, TripPreferences, BudgetAdvice } from '../types';
import { getCurrencySymbol } from '../utils';

interface BudgetPlannerProps {
  preferences: TripPreferences;
  breakdown: BudgetBreakdown;
  customExpenses: CustomExpense[];
  onUpdateExpenses: (expenses: CustomExpense[]) => void;
  onUpdatePreferences?: (prefs: TripPreferences) => void;
  budgetAdvice?: BudgetAdvice;
}

const COMMON_CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'ZAR', name: 'South African Rand' },
];

const getSymbol = (code: string) => getCurrencySymbol(code);

export default function BudgetPlanner({
  preferences,
  breakdown,
  customExpenses,
  onUpdateExpenses,
  onUpdatePreferences,
  budgetAdvice,
}: BudgetPlannerProps) {
  // Extract currency details with robust fallbacks
  const homeCurrency = preferences.homeCurrency || 'USD';
  const localCurrency = preferences.localCurrency || 'USD';
  const exchangeRate = preferences.exchangeRate || 1.0;

  // Local Exchange Rate Editing state
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState(exchangeRate.toString());
  const [rateError, setRateError] = useState<string | null>(null);

  // Local Currency Editing state
  const [isEditingLocalCur, setIsEditingLocalCur] = useState(false);
  const [tempLocalCur, setTempLocalCur] = useState(localCurrency);

  // Display mode (Combined/Total vs Per Person) state
  const [displayMode, setDisplayMode] = useState<'combined' | 'perPerson'>('combined');
  const numTravelers = preferences.travelersCount && preferences.travelersCount > 0 ? preferences.travelersCount : 1;
  const factor = displayMode === 'perPerson' ? numTravelers : 1;

  // Expense form state
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState<number | ''>('');
  const [newCategory, setNewCategory] = useState<'flights' | 'hotels' | 'food' | 'activities' | 'transport' | 'other'>('food');
  const [newType, setNewType] = useState<'estimated' | 'actual'>('actual');
  const [expenseCurrency, setExpenseCurrency] = useState<'home' | 'local'>('local');

  // Load default AI expenses if ledger is empty
  const handleLoadAIDefaults = () => {
    const defaults: CustomExpense[] = [
      { id: 'def-f', category: 'flights', title: 'Roundtrip Flights (AI Est.)', amount: breakdown.estimatedFlights, type: 'estimated', currency: 'home', originalAmount: breakdown.estimatedFlights },
      { id: 'def-h', category: 'hotels', title: 'Stays/Accommodation (AI Est.)', amount: breakdown.estimatedHotels, type: 'estimated', currency: 'home', originalAmount: breakdown.estimatedHotels },
      { id: 'def-d', category: 'food', title: 'Food & Dining (AI Est.)', amount: breakdown.estimatedFood, type: 'estimated', currency: 'home', originalAmount: breakdown.estimatedFood },
      { id: 'def-a', category: 'activities', title: 'Tours & Sights (AI Est.)', amount: breakdown.estimatedActivities, type: 'estimated', currency: 'home', originalAmount: breakdown.estimatedActivities },
      { id: 'def-t', category: 'transport', title: 'Local Transport (AI Est.)', amount: breakdown.estimatedTransport, type: 'estimated', currency: 'home', originalAmount: breakdown.estimatedTransport },
      { id: 'def-e', category: 'other', title: 'Emergency/Misc Fund (AI Est.)', amount: breakdown.estimatedEmergency, type: 'estimated', currency: 'home', originalAmount: breakdown.estimatedEmergency },
    ];
    onUpdateExpenses(defaults);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAmount) return;

    let amountInHome = Number(newAmount);
    if (expenseCurrency === 'local') {
      amountInHome = Math.round((Number(newAmount) / exchangeRate) * 100) / 100;
    }

    const expense: CustomExpense = {
      id: Math.random().toString(36).substring(2, 9),
      category: newCategory,
      title: newTitle.trim(),
      amount: amountInHome,
      type: newType,
      currency: expenseCurrency,
      originalAmount: Number(newAmount),
    };

    onUpdateExpenses([...customExpenses, expense]);
    setNewTitle('');
    setNewAmount('');
  };

  const handleDeleteExpense = (id: string) => {
    onUpdateExpenses(customExpenses.filter(e => e.id !== id));
  };

  const handleSaveRate = () => {
    const rateVal = parseFloat(tempRate);
    if (isNaN(rateVal) || rateVal <= 0) {
      setRateError("Please enter a valid positive exchange rate.");
      return;
    }
    setRateError(null);
    if (onUpdatePreferences) {
      onUpdatePreferences({
        ...preferences,
        exchangeRate: rateVal,
      });
    }
    setIsEditingRate(false);
  };

  const handleSaveLocalCurrency = (code: string) => {
    setTempLocalCur(code);
    setIsEditingLocalCur(false);
    
    // Find typical default rate ratio relative to home currency
    let approxUsdToLocal = 1.0;
    if (code === 'JPY') approxUsdToLocal = 155.0;
    else if (code === 'EUR') approxUsdToLocal = 0.92;
    else if (code === 'GBP') approxUsdToLocal = 0.78;
    else if (code === 'INR') approxUsdToLocal = 83.5;
    else if (code === 'CAD') approxUsdToLocal = 1.36;
    else if (code === 'AUD') approxUsdToLocal = 1.50;
    else if (code === 'SGD') approxUsdToLocal = 1.34;
    else if (code === 'AED') approxUsdToLocal = 3.67;
    else if (code === 'CNY') approxUsdToLocal = 7.24;
    else if (code === 'CHF') approxUsdToLocal = 0.89;
    else if (code === 'THB') approxUsdToLocal = 36.5;
    else if (code === 'KRW') approxUsdToLocal = 1375.0;

    const DEFAULT_USD_RATES_INTERNAL: Record<string, number> = {
      USD: 1.00,
      EUR: 0.92,
      GBP: 0.78,
      INR: 83.50,
      JPY: 155.00,
      CAD: 1.36,
      AUD: 1.50,
      SGD: 1.34,
      AED: 3.67,
      CNY: 7.24,
      CHF: 0.89,
      THB: 36.5,
      KRW: 1375.0,
    };
    
    const homeRateToUsd = DEFAULT_USD_RATES_INTERNAL[homeCurrency] || 1.0;
    const finalExchangeRate = (1 / homeRateToUsd) * approxUsdToLocal;

    if (onUpdatePreferences) {
      onUpdatePreferences({
        ...preferences,
        localCurrency: code,
        exchangeRate: finalExchangeRate,
      });
      setTempRate(finalExchangeRate.toString());
    }
  };

  // Calculations
  const maxBudget = preferences.budgetLimit || 1500;

  // Compute sums
  const totalAI =
    breakdown.estimatedFlights +
    breakdown.estimatedHotels +
    breakdown.estimatedFood +
    breakdown.estimatedActivities +
    breakdown.estimatedTransport +
    breakdown.estimatedEmergency;

  const currentExpenses = customExpenses.length > 0 ? customExpenses : [];

  const totalEstimated = currentExpenses
    .filter(e => e.type === 'estimated')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalActual = currentExpenses
    .filter(e => e.type === 'actual')
    .reduce((sum, e) => sum + e.amount, 0);

  const activeTotal = currentExpenses.length > 0 ? (totalEstimated + totalActual) : totalAI;
  const usagePercent = Math.min((activeTotal / maxBudget) * 100, 100);
  const isOverBudget = activeTotal > maxBudget;
  const overAmount = activeTotal - maxBudget;

  // Dynamic budget advice calculations
  let isSufficientCheck = true;
  let adviceScore = 100;
  let adviceMsg = "";

  if (budgetAdvice) {
    // If we have custom expenses or exact sums that exceed the budget, adapt the sufficient check dynamically
    isSufficientCheck = activeTotal <= maxBudget;
    
    if (activeTotal > maxBudget) {
      // Scale down score slightly to reflect that the current active selections exceed the target
      adviceScore = Math.min(49, budgetAdvice.adequacyScore);
    } else {
      adviceScore = budgetAdvice.adequacyScore;
    }
    adviceMsg = budgetAdvice.adviceMessage;
  } else {
    // Dynamic client-side fallback calculation
    isSufficientCheck = activeTotal <= maxBudget;
    if (maxBudget <= 0) {
      adviceScore = 0;
      adviceMsg = "No budget limit was defined. Please specify a maximum budget limit to receive personalized local travel recommendations.";
    } else {
      const ratio = activeTotal / maxBudget;
      adviceScore = Math.max(0, Math.min(100, Math.round((1 - (ratio - 1)) * 100)));
      if (ratio <= 0.7) {
        adviceMsg = `Abundantly Sufficient! Your budget of ${getSymbol(homeCurrency)}${maxBudget.toLocaleString()} is very comfortable for this trip. You currently have a spacious buffer of ${getSymbol(homeCurrency)}${(maxBudget - activeTotal).toLocaleString()} (${getSymbol(localCurrency)}${Math.round((maxBudget - activeTotal) * exchangeRate).toLocaleString()} ${localCurrency}) which can be splurged on luxury dining, premium stays, or fine experiences.`;
      } else if (ratio <= 1.0) {
        adviceMsg = `Perfectly Sufficient! Your estimated trip expenses total ${getSymbol(homeCurrency)}${activeTotal.toLocaleString()} which fits beautifully inside your budget limit of ${getSymbol(homeCurrency)}${maxBudget.toLocaleString()}. You have a safe, healthy emergency buffer of ${getSymbol(homeCurrency)}${(maxBudget - activeTotal).toLocaleString()} to handle incidental costs.`;
      } else {
        adviceMsg = `Slightly Insufficient! Your current estimated total expenses of ${getSymbol(homeCurrency)}${activeTotal.toLocaleString()} exceed your specified budget of ${getSymbol(homeCurrency)}${maxBudget.toLocaleString()} by ${getSymbol(homeCurrency)}${(activeTotal - maxBudget).toLocaleString()} (${getSymbol(localCurrency)}${Math.round((activeTotal - maxBudget) * exchangeRate).toLocaleString()} ${localCurrency}). Try pruning minor expenses or opting for free sightseeing options to make your trip healthy.`;
      }
    }
  }

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'flights': return 'bg-sky-500';
      case 'hotels': return 'bg-indigo-500';
      case 'food': return 'bg-amber-500';
      case 'activities': return 'bg-emerald-500';
      case 'transport': return 'bg-purple-500';
      default: return 'bg-slate-500';
    }
  };

  const getCategoryBg = (cat: string) => {
    switch (cat) {
      case 'flights': return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'hotels': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'food': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'activities': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'transport': return 'bg-purple-50 text-purple-700 border-purple-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Dynamic Worldwide Currency Widget */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl p-5 md:p-6 border border-slate-700 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        {/* Glow background accent */}
        <div className="absolute right-0 bottom-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-teal-500/20 text-teal-300 border border-teal-500/20 rounded px-2 py-0.5 font-sans">
              Worldwide Currency System
            </span>
          </div>
          <h3 className="font-display font-bold text-lg text-slate-150 flex items-center gap-2">
            Local Expense Conversions
          </h3>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Expenses are tracked in your home currency <strong>{homeCurrency}</strong> to stay aligned with your budget. Log items in the local currency <strong>{localCurrency}</strong> to convert them in real time using your custom rates.
          </p>
        </div>

        {/* Currency configuration panels */}
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto font-sans relative z-10 shrink-0">
          {/* Local Currency selection */}
          <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl flex-1 sm:flex-initial min-w-[180px]">
            <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Destination Currency</span>
            <div className="mt-1 flex items-center justify-between">
              {isEditingLocalCur ? (
                <select
                  value={tempLocalCur}
                  onChange={e => handleSaveLocalCurrency(e.target.value)}
                  onBlur={() => setIsEditingLocalCur(false)}
                  className="bg-slate-700 text-white font-bold text-sm px-2 py-1 rounded border border-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  autoFocus
                >
                  {COMMON_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-teal-400 font-mono">{localCurrency}</span>
                  <span className="text-xs text-slate-400">({getSymbol(localCurrency)})</span>
                </div>
              )}
              {!isEditingLocalCur && (
                <button
                  type="button"
                  onClick={() => { setTempLocalCur(localCurrency); setIsEditingLocalCur(true); }}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-all animate-fade-in"
                  title="Change destination currency"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Exchange Rate Editing */}
          <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl flex-1 sm:flex-initial min-w-[200px]">
            <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Exchange Rate (Home → Local)</span>
            <div className="mt-1 flex items-center justify-between">
              {isEditingRate ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="text-xs text-slate-400 font-mono">1 {homeCurrency} =</span>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    value={tempRate}
                    onChange={e => setTempRate(e.target.value)}
                    className="w-20 px-1.5 py-0.5 text-xs bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                    placeholder="1.0"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveRate}
                    className="p-1 bg-teal-600 hover:bg-teal-700 rounded text-white"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTempRate(exchangeRate.toString()); setIsEditingRate(false); }}
                    className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-slate-300">1 {homeCurrency} =</span>
                  <span className="font-extrabold text-teal-400 text-sm">
                    {exchangeRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </span>
                  <span className="text-slate-300">{localCurrency}</span>
                </div>
              )}
              {!isEditingRate && (
                <button
                  type="button"
                  onClick={() => { setTempRate(exchangeRate.toString()); setIsEditingRate(true); }}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-all"
                  title="Modify conversion rate"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {rateError && (
              <span className="text-[10px] text-red-400 block mt-1">{rateError}</span>
            )}
          </div>
        </div>
      </div>

      {/* AI Budget Advisor Panel */}
      <div className="bg-gradient-to-r from-indigo-50 via-teal-50/50 to-emerald-50/20 border border-indigo-100/70 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-200/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Left Side: Score & Status */}
        <div className="flex items-center gap-4 shrink-0 relative z-10">
          <div className="relative flex items-center justify-center">
            {/* Circular Progress Gauge */}
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                className="stroke-slate-100 fill-none"
                strokeWidth="6"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                className={`fill-none transition-all duration-1000 ${
                  adviceScore >= 80 ? 'stroke-emerald-500' : adviceScore >= 50 ? 'stroke-amber-500' : 'stroke-rose-500'
                }`}
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - adviceScore / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-lg font-extrabold text-slate-800 font-mono leading-none">{adviceScore}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Score</span>
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border ${
                isSufficientCheck 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/50' 
                  : 'bg-rose-50 text-rose-800 border-rose-200/50'
              }`}>
                {isSufficientCheck ? 'Budget Sufficient' : 'Budget Tight'}
              </span>
            </div>
            <h4 className="font-display font-extrabold text-slate-800 text-sm sm:text-base mt-1.5">
              {isSufficientCheck ? 'Plan is Budget-Healthy!' : 'Budget Sufficiency Alert'}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">AI analyzed travel costs vs. budget limit</p>
          </div>
        </div>

        {/* Divider for MD+ screens */}
        <div className="hidden md:block w-px h-16 bg-slate-200/80 shrink-0 self-center" />

        {/* Right Side: Message & Advice */}
        <div className="flex-1 space-y-1 relative z-10">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
            <Coins className="w-4 h-4 text-indigo-500" />
            <span>AI Budget Advisor Advice:</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">
            {adviceMsg}
          </p>
        </div>
      </div>

      {/* Budget Warning Header Banner */}
      {isOverBudget && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3.5 items-start">
          <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-red-800 text-sm">Budget Limit Exceeded!</h3>
            <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
              Your planned expenses total <span className="font-bold">{getSymbol(homeCurrency)}{(activeTotal / factor).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>, which exceeds your maximum budget limit of <span className="font-bold">{getSymbol(homeCurrency)}{(maxBudget / factor).toLocaleString()}</span> by <span className="font-extrabold">{getSymbol(homeCurrency)}{(overAmount / factor).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> ({getSymbol(localCurrency)}{((overAmount / factor) * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} {localCurrency}){displayMode === 'perPerson' ? ' (per person)' : ''}.
              Try trimming dining/shopping costs or downgrading stays to keep your journey optimal.
            </p>
          </div>
        </div>
      )}

      {/* Per Person vs Combined Toggle Selector Card */}
      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h4 className="font-display font-bold text-slate-800 text-sm">Cost Breakdown View</h4>
            <p className="text-xs text-slate-500">
              Currently planned for <span className="font-bold text-indigo-600 font-mono">{numTravelers} traveler{numTravelers > 1 ? 's' : ''}</span>. Switch display to view individual or combined costs.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl border border-slate-200 select-none">
          <button
            type="button"
            onClick={() => setDisplayMode('combined')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              displayMode === 'combined'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Combined Total
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode('perPerson')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              displayMode === 'perPerson'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Per Person
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cost breakdown progress chart */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-display font-bold text-slate-800 text-base">Cost Allocation Analysis</h3>
            <p className="text-xs text-slate-500">How your funds are distributed, converted in real time.</p>
          </div>

          {/* Quick Gauge */}
          <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{displayMode === 'perPerson' ? 'Per Person Est.' : 'Total Est. Cost'} ({homeCurrency})</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-slate-800 font-mono">
                    {getSymbol(homeCurrency)}{(activeTotal / factor).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="text-right space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{displayMode === 'perPerson' ? 'Per Person Local' : 'Local Equivalent'} ({localCurrency})</span>
                <div className="flex items-baseline gap-1 justify-end font-mono">
                  <span className="text-xl font-extrabold text-teal-600">
                    {getSymbol(localCurrency)}{((activeTotal / factor) * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200/50 pt-2 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Budget Limit usage</span>
              <div className="flex items-center gap-2 justify-end">
                <span className={`text-sm font-extrabold font-mono ${isOverBudget ? 'text-red-500' : 'text-teal-600'}`}>
                  {Math.round((activeTotal / maxBudget) * 100)}%
                </span>
                <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isOverBudget ? 'bg-red-500' : 'bg-teal-500'}`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Progress list */}
          <div className="space-y-4 pt-2">
            {[
              { label: '✈️ Flights & Transit', value: breakdown.estimatedFlights, category: 'flights' },
              { label: '🏨 Hotels & Stays', value: breakdown.estimatedHotels, category: 'hotels' },
              { label: '🍽️ Food & Dining', value: breakdown.estimatedFood, category: 'food' },
              { label: '🎟️ Sights & Activities', value: breakdown.estimatedActivities, category: 'activities' },
              { label: '🚇 Local Transport', value: breakdown.estimatedTransport, category: 'transport' },
              { label: '🛡️ Emergency Fund', value: breakdown.estimatedEmergency, category: 'other' },
            ].map((item, idx) => {
              const itemPercent = totalAI > 0 ? (item.value / totalAI) * 100 : 0;
              const displayVal = item.value / factor;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    <div className="text-right flex flex-col items-end">
                      <span className="font-bold text-slate-800 font-mono">
                        {getSymbol(homeCurrency)}{displayVal.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[10px] text-slate-400 font-normal">({Math.round(itemPercent)}%)</span>
                      </span>
                      <span className="text-[10px] text-teal-600/80 font-mono">
                        ≈ {getSymbol(localCurrency)}{(displayVal * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} {localCurrency}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getCategoryColor(item.category)}`}
                      style={{ width: `${itemPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense tracker ledger */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="font-display font-bold text-slate-800 text-base">Expense Ledger Tracker</h3>
              <p className="text-xs text-slate-500">Log payments in any currency. Home conversions update instantly.</p>
            </div>
            {customExpenses.length === 0 && (
              <button
                type="button"
                onClick={handleLoadAIDefaults}
                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold rounded-xl border border-teal-100 flex items-center gap-1.5 transition-all shadow-sm"
                title="Populate ledger with AI estimated costs"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Initialize Ledger
              </button>
            )}
          </div>

          {/* Quick Ledger Balances */}
          {customExpenses.length > 0 && (
            <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-sans">
              <div className="border-r border-slate-200/60 pr-2 space-y-1 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                  {displayMode === 'perPerson' ? 'Est. Per Person' : 'Total Estimated'}
                </span>
                <span className="block text-sm font-extrabold text-slate-700 font-mono">
                  {getSymbol(homeCurrency)}{(totalEstimated / factor).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className="block text-[10px] text-slate-400 font-mono">
                  {getSymbol(localCurrency)}{((totalEstimated / factor) * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} {localCurrency}
                </span>
              </div>
              <div className="pl-2 space-y-1 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                  {displayMode === 'perPerson' ? 'Paid Per Person' : 'Total Actual Paid'}
                </span>
                <span className="block text-sm font-extrabold text-teal-600 font-mono">
                  {getSymbol(homeCurrency)}{(totalActual / factor).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className="block text-[10px] text-teal-600/80 font-mono">
                  {getSymbol(localCurrency)}{((totalActual / factor) * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} {localCurrency}
                </span>
              </div>
            </div>
          )}

          {/* Form to log new cost */}
          <form onSubmit={handleAddExpense} className="bg-slate-50/50 p-4 border border-slate-150 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Log a New Cost</h4>
                <p className="text-[9px] text-slate-400 font-medium">Log combined total for {numTravelers} traveler{numTravelers > 1 ? 's' : ''}</p>
              </div>
              
              {/* Currency Mode Toggle Selector */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 select-none">
                <button
                  type="button"
                  onClick={() => setExpenseCurrency('local')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                    expenseCurrency === 'local'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Local ({localCurrency})
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseCurrency('home')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                    expenseCurrency === 'home'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Home ({homeCurrency})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Souvenirs, Starbucks, Subway"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block">Category</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700"
                >
                  <option value="flights">✈️ Transit</option>
                  <option value="hotels">🏨 Stay</option>
                  <option value="food">🍽️ Dining</option>
                  <option value="activities">🎟️ Tour</option>
                  <option value="transport">🚇 Transport</option>
                  <option value="other">🛍️ Other</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block flex justify-between">
                  <span>Amount</span>
                  <span className="font-extrabold text-teal-600 font-mono">
                    {expenseCurrency === 'local' ? getSymbol(localCurrency) : getSymbol(homeCurrency)}
                  </span>
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  placeholder="25"
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-mono"
                />
              </div>

              <div className="sm:col-span-2 space-y-1 flex flex-col justify-end">
                <button
                  type="submit"
                  disabled={!newTitle.trim() || !newAmount}
                  className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1 shadow-sm disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" /> Log
                </button>
              </div>
            </div>

            {/* Quick Conversion Helper Preview */}
            {newAmount !== '' && !isNaN(Number(newAmount)) && (
              <div className="bg-white/60 rounded-lg p-2.5 border border-slate-100 text-[11px] text-slate-500 font-medium flex items-center justify-between font-sans">
                <span>Real-time conversion calculation:</span>
                <span className="font-mono font-bold text-teal-600">
                  {expenseCurrency === 'local' ? (
                    <>
                      {getSymbol(localCurrency)}{Number(newAmount).toLocaleString()} {localCurrency} ≈ {getSymbol(homeCurrency)}{(Number(newAmount) / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {homeCurrency}
                    </>
                  ) : (
                    <>
                      {getSymbol(homeCurrency)}{Number(newAmount).toLocaleString()} {homeCurrency} ≈ {getSymbol(localCurrency)}{(Number(newAmount) * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {localCurrency}
                    </>
                  )}
                </span>
              </div>
            )}

            <div className="flex gap-4 border-t border-slate-200/30 pt-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="radio"
                  name="newType"
                  checked={newType === 'actual'}
                  onChange={() => setNewType('actual')}
                  className="accent-teal-600"
                />
                Actual cost (paid)
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="radio"
                  name="newType"
                  checked={newType === 'estimated'}
                  onChange={() => setNewType('estimated')}
                  className="accent-teal-600"
                />
                Estimated budget target
              </label>
            </div>
          </form>

          {/* Ledger list */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {customExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Coins className="w-8 h-8 text-slate-400 mb-2" />
                <h4 className="text-xs font-bold text-slate-700">Ledger is Empty</h4>
                <p className="text-[11px] text-slate-500 max-w-xs mt-1 leading-relaxed">
                  Click 'Initialize Ledger' above to pre-load all of Gemini's estimated expenses, or enter your own.
                </p>
              </div>
            ) : (
              currentExpenses.map(expense => {
                const isLocalType = expense.currency === 'local';
                const homeAmt = expense.amount / factor;
                const localAmt = (expense.originalAmount !== undefined 
                  ? expense.originalAmount 
                  : expense.amount * exchangeRate) / factor;

                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-white transition-all group shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getCategoryColor(expense.category)}`} />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{expense.title}</h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className={`text-[9px] uppercase font-bold border rounded-full px-1.5 py-0.2 leading-none shrink-0 ${getCategoryBg(expense.category)}`}>
                            {expense.category}
                          </span>
                          <span className={`text-[9px] font-semibold rounded px-1 shrink-0 ${
                            expense.type === 'actual' ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {expense.type}
                          </span>
                          {isLocalType && (
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono shrink-0">
                              Logged Local
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 font-sans">
                      <div className="text-right flex flex-col justify-center">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-800 font-mono">
                          {getSymbol(homeCurrency)}{homeAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-teal-600 font-semibold font-mono">
                          ≈ {getSymbol(localCurrency)}{localAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })} {localCurrency}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-slate-300 hover:text-red-500 p-1 group-hover:opacity-100 sm:opacity-0 transition-all rounded hover:bg-red-50"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
