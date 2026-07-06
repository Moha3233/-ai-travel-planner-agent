export interface TripPreferences {
  source?: string; // Starting location/Origin
  destination: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  budgetLimit: number;
  budgetTier: 'budget' | 'moderate' | 'luxury';
  travelStyle: string[]; // Solo, Family, Couple, Friends, Adventure, Luxury, Culture, Food, Nature, Shopping, Relaxing, etc.
  specialPreferences: string;
  homeCurrency?: string; // e.g. "USD", "EUR", "INR"
  localCurrency?: string; // e.g. "JPY", "EUR", "GBP"
  exchangeRate?: number; // 1 Home Currency = X Local Currency
  travelersCount?: number; // Number of members/travelers
}

export interface FlightOption {
  airline: string;
  typicalPrice: number;
  duration: string;
  layovers: string;
  bookingTip: string;
}

export interface HotelOption {
  name: string;
  rating: string;
  pricePerNight: number;
  area: string;
  whyItFits: string;
  amenities: string[];
}

export interface Activity {
  id: string; // Unique client-side ID
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening';
  title: string;
  description: string;
  location: string;
  estimatedCost: number;
  transportTip: string;
  completed?: boolean;
}

export interface DayItinerary {
  dayNumber: number;
  dayTitle: string;
  activities: Activity[];
}

export interface Attraction {
  name: string;
  description: string;
  cost: number;
  bestTime: string;
}

export interface LocalTipPhrase {
  english: string;
  local: string;
}

export interface LocalTips {
  weather: string;
  packing: string[];
  safety: string;
  phrases: LocalTipPhrase[];
}

export interface BudgetBreakdown {
  estimatedFlights: number;
  estimatedHotels: number;
  estimatedFood: number;
  estimatedActivities: number;
  estimatedTransport: number;
  estimatedEmergency: number;
}

export interface CustomExpense {
  id: string;
  category: 'flights' | 'hotels' | 'food' | 'activities' | 'transport' | 'other';
  title: string;
  amount: number; // always stored in Home Currency for budget consistency
  type: 'estimated' | 'actual';
  currency?: 'home' | 'local';
  originalAmount?: number; // the amount typed by the user in the selected currency
}

export interface BudgetAdvice {
  isSufficient: boolean;
  adequacyScore: number;
  adviceMessage: string;
}

export interface TravelNewsItem {
  id: string;
  title: string;
  category: 'safety' | 'event' | 'logistics' | 'weather';
  severity: 'critical' | 'warning' | 'info';
  date: string;
  content: string;
  actionableAdvice: string;
}

export interface TripPlan {
  id: string; // unique identifier
  createdAt: string;
  preferences: TripPreferences;
  summary: string;
  budgetBreakdown: BudgetBreakdown;
  flights: FlightOption[];
  hotels: HotelOption[];
  itinerary: DayItinerary[];
  attractions: Attraction[];
  localTips: LocalTips;
  notes: string;
  customExpenses: CustomExpense[];
  localCurrencyCode?: string;
  typicalExchangeRate?: number;
  budgetAdvice?: BudgetAdvice;
  travelNews?: TravelNewsItem[];
}
