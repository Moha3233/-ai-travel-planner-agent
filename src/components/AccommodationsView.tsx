import React, { useState } from 'react';
import { 
  Plane, 
  Building, 
  Star, 
  Tag, 
  MapPin, 
  Newspaper, 
  AlertTriangle, 
  ShieldAlert, 
  Compass, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Activity, 
  ShieldCheck, 
  SunDim, 
  Info,
  Calendar
} from 'lucide-react';
import { FlightOption, HotelOption, TravelNewsItem } from '../types';
import { formatCurrency } from '../utils';

interface AccommodationsViewProps {
  flights: FlightOption[];
  hotels: HotelOption[];
  homeCurrency?: string;
  destination: string;
  travelNews?: TravelNewsItem[];
}

const getDefaultNews = (destination: string): TravelNewsItem[] => {
  const isIndia = /india|mumbai|delhi|bangalore|bengaluru|kolkata|chennai|hyderabad|goa|jaipur|agra|pune|ahmedabad|kochi/i.test(destination);
  
  const baseNews: TravelNewsItem[] = [
    {
      id: 'def-news-1',
      title: `Local Entry & Tourist Visa Regulations`,
      category: 'logistics',
      severity: 'info',
      date: 'Current Alert',
      content: `Ensure your passport has at least 6 months of validity from your planned departure date. Several fast-track digital visa systems and biometric immigration counters are active for tourists entering ${destination}.`,
      actionableAdvice: `Check the official governmental portal of your home country to confirm electronic visa waiver or eVisa requirements before traveling.`
    },
    {
      id: 'def-news-2',
      title: `Public Transport & Contactless Travel Cards`,
      category: 'logistics',
      severity: 'info',
      date: 'Transit Update',
      content: `${destination} features an advanced transit infrastructure. Opting for reloadable travel cards, multi-day tourist passes, or digital mobile fare apps provides up to 40% savings compared to single tickets.`,
      actionableAdvice: `Look up local transit pass options immediately upon arriving at the major airport or railway terminal to save on daily commuting.`
    },
    {
      id: 'def-news-3',
      title: `Seasonal Weather & Packing Advice`,
      category: 'weather',
      severity: 'warning',
      date: 'Seasonal Note',
      content: `Temperatures and microclimates in ${destination} fluctuate. Quick seasonal showers, temperature drops, or high solar UV indexes are common depending on the neighborhood or elevation.`,
      actionableAdvice: `Pack layers, comfortable waterproof walking footwear, and a compact umbrella. Always check the morning forecast before embarking on outdoor tours.`
    },
    {
      id: 'def-news-4',
      title: `Safety Precaution in High-Traffic Tourist Areas`,
      category: 'safety',
      severity: 'warning',
      date: 'Safety Notice',
      content: `Like all popular global travel hubs, pick-pocketing and tourist scams (such as unlicensed taxis or overpriced tours) are reported in high-density areas, public transit centers, and crowded street markets.`,
      actionableAdvice: `Keep bags secure, avoid placing phones or wallets in rear pockets, and use official ride-hailing applications or metered city taxis.`
    }
  ];

  if (isIndia) {
    // Add the Indian transit warning replacement for UTS
    return [
      {
        id: 'india-news-rail',
        title: `UTS App Deprecated — Use Railone for Local Trains`,
        category: 'logistics',
        severity: 'critical',
        date: 'Important Transit Notice',
        content: `The official unreserved ticketing 'UTS' app has been deprecated and is no longer functional. Tourists commuting via local trains or suburban passenger rail services must now use the 'Railone' app to purchase unreserved journey, platform, and season tickets.`,
        actionableAdvice: `Download the 'Railone' app on your smartphone, set up an account, and verify your credentials before heading to the railway station to avoid long ticketing queues.`
      },
      ...baseNews.filter(item => item.id !== 'def-news-2') // Replace generic transit card with specific Indian rail card
    ];
  }

  return baseNews;
};

export default function AccommodationsView({ 
  flights, 
  hotels, 
  homeCurrency, 
  destination,
  travelNews 
}: AccommodationsViewProps) {
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedNewsId, setExpandedNewsId] = useState<string | null>('def-news-1'); // Default open first item

  // Merge generated news with default fallbacks if none returned
  const newsList = travelNews && travelNews.length > 0 ? travelNews : getDefaultNews(destination);

  // Filter news based on selected category
  const filteredNews = activeCategory === 'all' 
    ? newsList 
    : newsList.filter(news => news.category === activeCategory);

  // Category statistics/count
  const getCategoryCount = (category: string) => {
    if (category === 'all') return newsList.length;
    return newsList.filter(news => news.category === category).length;
  };

  // Helper icons for news categories
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'safety':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'logistics':
        return <Compass className="w-4 h-4 text-indigo-500" />;
      case 'weather':
        return <SunDim className="w-4 h-4 text-amber-500" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  // Helper styles for severity tags
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="text-[9px] font-bold text-red-700 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 uppercase tracking-wide">
            Critical
          </span>
        );
      case 'warning':
        return (
          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 uppercase tracking-wide">
            Precaution
          </span>
        );
      default:
        return (
          <span className="text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded px-1.5 py-0.5 uppercase tracking-wide">
            Info
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Flights Section */}
      <div className="lg:col-span-4 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-800">Flight Recommendations</h2>
            <p className="text-xs text-slate-500 font-sans">Smart round-trip suggestions to destination.</p>
          </div>
        </div>

        {flights && flights.length > 0 ? (
          <div className="space-y-4">
            {flights.map((flight, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display font-bold text-slate-800 text-base">{flight.airline}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{flight.duration} • {flight.layovers}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-sky-600 font-mono">
                      {formatCurrency(flight.typicalPrice, homeCurrency)}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-sans">est. roundtrip</span>
                  </div>
                </div>

                <div className="bg-sky-50/50 rounded-xl p-3 border border-sky-100/30 flex gap-2">
                  <Tag className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-sky-800 font-sans leading-relaxed text-left">
                    <span className="font-bold">Booking Advice: </span>
                    {flight.bookingTip}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
            No flight suggestions available.
          </div>
        )}
      </div>

      {/* Hotels & Travel News Section */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-800">Recommended Stays & Local News</h2>
            <p className="text-xs text-slate-500 font-sans">Secure hand-picked accommodations and view real-time travel alerts for your destination.</p>
          </div>
        </div>

        {hotels && hotels.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* List of Hotels */}
            <div className="xl:col-span-6 space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {hotels.map((hotel, idx) => {
                const hotelId = `hotel-${idx}`;
                const isSelected = selectedHotelId === hotelId;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedHotelId(hotelId)}
                    className={`bg-white rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row overflow-hidden text-left ${
                      isSelected
                        ? 'border-teal-500 ring-2 ring-teal-500/10 shadow-md scale-[0.99]'
                        : 'border-slate-100 shadow-sm hover:border-slate-200 hover:shadow'
                    }`}
                  >
                    {/* Visual Thumbnail Decorator */}
                    <div className={`sm:w-32 flex flex-col justify-center items-center p-4 text-center shrink-0 border-b sm:border-b-0 sm:border-r select-none transition-colors ${
                      isSelected ? 'bg-teal-50/50 border-teal-100' : 'bg-gradient-to-br from-teal-500/5 to-teal-600/10 border-slate-50'
                    }`}>
                      <Building className="w-8 h-8 text-teal-600 mb-1.5" />
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-100 rounded-full px-2 py-0.5 flex items-center gap-0.5 leading-none">
                        <Star className="w-2.5 h-2.5 fill-teal-600 stroke-teal-600" />
                        {hotel.rating}
                      </span>
                    </div>

                    {/* Hotel Details */}
                    <div className="p-4 flex-1 space-y-2.5">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-display font-bold text-slate-800 text-sm sm:text-base leading-tight">{hotel.name}</h3>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {hotel.area}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-base font-extrabold text-teal-600 font-mono">
                            {formatCurrency(hotel.pricePerNight, homeCurrency)}
                          </span>
                          <span className="text-[9px] text-slate-400 block">/ night</span>
                        </div>
                      </div>

                      <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-sans bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50 line-clamp-2">
                        {hotel.whyItFits}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Travel News Feed replaces MapViewer */}
            <div className="xl:col-span-6 bg-white border border-slate-100 rounded-3xl p-4 shadow-sm flex flex-col space-y-4">
              
              {/* News Header */}
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                    <Newspaper className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-800 text-sm">Travel News & Advisories</h3>
                    <p className="text-[10px] text-slate-400">Important safety & logistical briefs</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Updates
                </span>
              </div>

              {/* Category selector pills */}
              <div className="flex flex-wrap gap-1 border-b border-slate-50 pb-3">
                {[
                  { id: 'all', label: 'All Feed' },
                  { id: 'safety', label: '⚠️ Safety' },
                  { id: 'logistics', label: '🚆 Transit' },
                  { id: 'weather', label: '☀️ Weather' },
                  { id: 'event', label: '🎉 Events' }
                ].map(category => {
                  const count = getCategoryCount(category.id);
                  const isCatSelected = activeCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-display tracking-tight transition-all flex items-center gap-1 cursor-pointer border ${
                        isCatSelected 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-100/50 hover:bg-slate-100'
                      }`}
                    >
                      {category.label}
                      <span className={`text-[9px] rounded-full px-1 font-mono ${
                        isCatSelected ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* List of advisories & news */}
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {filteredNews.length > 0 ? (
                  filteredNews.map((news) => {
                    const isExpanded = expandedNewsId === news.id;
                    const isDefNews = news.id.startsWith('def-news');
                    return (
                      <div 
                        key={news.id} 
                        className={`border rounded-2xl transition-all overflow-hidden text-left ${
                          isExpanded 
                            ? 'border-indigo-100 shadow-sm bg-gradient-to-b from-indigo-500/[0.01] to-indigo-500/[0.03]' 
                            : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        {/* News Header Card */}
                        <div 
                          onClick={() => setExpandedNewsId(isExpanded ? null : news.id)}
                          className="p-3.5 flex justify-between items-start gap-2.5 cursor-pointer select-none"
                        >
                          <div className="flex gap-2.5 items-start">
                            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 mt-0.5 shrink-0">
                              {getCategoryIcon(news.category)}
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-display font-bold text-slate-800 text-xs leading-snug">
                                {news.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[9px] text-slate-400 font-mono">
                                  {news.date}
                                </span>
                                <span className="text-[8px] text-slate-300">•</span>
                                {getSeverityBadge(news.severity)}
                              </div>
                            </div>
                          </div>

                          <div className="text-slate-400 p-1 hover:text-slate-600">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100/40 text-left space-y-3 font-sans">
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {news.content}
                            </p>

                            {/* Actionable advice spotlight */}
                            <div className="bg-amber-50/50 border border-amber-100/60 rounded-xl p-3 flex gap-2">
                              <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0 animate-pulse" />
                              <div className="text-left space-y-0.5">
                                <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block font-display">
                                  Action Plan & Safety Advice
                                </span>
                                <p className="text-[11px] text-amber-950 font-medium leading-relaxed">
                                  {news.actionableAdvice}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl">
                    <AlertTriangle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No updates matching this category filter.</p>
                  </div>
                )}
              </div>

              {/* Safety reassurance badge */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100/60 p-2.5 rounded-xl text-left">
                <Activity className="w-4 h-4 text-emerald-600 animate-pulse shrink-0" />
                <p className="text-[10px] text-slate-500 leading-normal">
                  <span className="font-bold text-slate-700">Safety Tip:</span> Always save offline duplicates of reservation receipts, boarding tickets, and support hotlines in your Notebook.
                </p>
              </div>

            </div>

          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
            No hotel suggestions available.
          </div>
        )}
      </div>
    </div>
  );
}
