import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { sanitizePIIObject, sanitizePIIText } from "./src/utils/security";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Travel Plan Generation
  app.post("/api/generate-trip", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(400).json({
          error: "Gemini API key is not configured. Please open 'Settings' > 'Secrets' panel in the top-right corner of Google AI Studio and configure GEMINI_API_KEY with your API key.",
        });
      }

      const clientEmail = (req.headers["x-user-email"] || req.body.userEmail || "mohanduratkar36@gmail.com") as string;
      const { sanitized: sanitizedPreferences, redactedCount, redactedTypes } = sanitizePIIObject(req.body, clientEmail);

      if (redactedCount > 0) {
        console.log(`[SECURITY SHIELD] Redacted ${redactedCount} occurrences of sensitive private information (PII categories: ${redactedTypes.join(", ")}).`);
      }

      const {
        source,
        destination,
        startDate,
        endDate,
        durationDays,
        budgetLimit,
        budgetTier,
        travelStyle,
        specialPreferences,
        travelersCount,
      } = sanitizedPreferences;

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const styleString = travelStyle && travelStyle.length > 0 ? travelStyle.join(", ") : "Balanced";
      const customPreferences = specialPreferences ? `Special Preferences: ${specialPreferences}` : "";
      const travelers = travelersCount || 1;

      const prompt = `Generate a highly personalized travel plan for a trip departing from ${source || "a flexible location"} to ${destination}.
Trip Specifications:
- Starting Location (Origin): ${source || "Flexible / Not specified"}
- Destination: ${destination}
- Duration: ${durationDays} Days (Planned from: ${startDate || "Flexible"} to ${endDate || "Flexible"})
- Number of Travelers (Members): ${travelers}
- Budget Category: ${budgetTier} (Total budget limit: $${budgetLimit || "flexible"})
- Travel Style: ${styleString}
- Special Requests & Constraints: ${customPreferences}

IMPORTANT BUDGETING RULES for ${travelers} travelers:
1. All flight cost estimates (typicalPrice) and totals (estimatedFlights) MUST represent the combined total for ALL ${travelers} members.
2. All hotel accommodation estimates (pricePerNight) and totals (estimatedHotels) MUST cover suitable lodging/rooms for ALL ${travelers} guests (e.g., sharing or multiple rooms as needed for ${travelers} guests).
3. All food, activities (estimatedCost), local transport, and miscellaneous cost estimates MUST represent the combined total for ALL ${travelers} members.
4. Ensure the sum of all estimated costs in the budget breakdown approximates the user's total budget limit ($${budgetLimit || "flexible"}), which is for ALL ${travelers} travelers.

Ensure your recommendations are detailed, realistic, and strictly localized. Provide specific hotel suggestions, typical flight price ranges departing from ${source || "the starting location"} to ${destination}, a rich day-by-day timeline, and a visualizable expense breakdown that complies with the maximum budget limit of $${budgetLimit || "flexible"}.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: `You are an elite global travel concierge, expert tour planner, and master local guide. 
Your goal is to produce highly personalized, structured, and vivid itineraries. 

PRIVACY & INFORMATION SECURITY RULE:
Under no circumstances should you look for, parse, display, or speculate on any personal or private user information (such as real names, email addresses, phone numbers, passport numbers, home addresses, or credit card details). If any redacted tokens (e.g. [REDACTED_EMAIL], [REDACTED_PHONE], [REDACTED_NAME], [REDACTED_CARD], [REDACTED_SECRET]) are present in the user request, strictly treat them as anonymous entities, do not try to search for their real-world values, and only provide safe, generic, and public tour information.

PRICING & ACCURATE FARES RULE:
You must calculate highly realistic, verified, and accurate costs and fare estimates (in USD) tailored to the specified budget category:
- 'budget': hostel or simple guesthouse, street food and casual diners, public transit, free or cheap sights.
- 'moderate': 3-4 star midscale hotels, balanced mix of dining, subway/cabs, moderate paid tours.
- 'luxury': 5-star premium hotels, fine dining, private transfers, exclusive private guides and entries.
Ensure flight fare estimates and hotel prices correspond closely to actual average rates for the specified destination and origin.

INDIAN RAILWAY TRANSIT RULE:
For any destinations in India, the official unreserved ticketing 'UTS' app is completely non-functional/deprecated. For unreserved rail tickets, suburban local commuter trains, and station platforms, you MUST explicitly recommend the 'Railone' app as the mandatory, modern replacement for UTS. Never recommend the UTS app.

Ensure the sum of all estimated costs approximates the user's budget limit.
Evaluate if the user's provided budget is sufficient or if it is too tight or abundant for the destination, travel style, and duration. Give a realistic score from 0 to 100, a boolean, and localized advice explaining why (such as local price hacks, free entry days, or dining tips).
Always format your output strictly as a JSON object matching the requested schema. Provide real, specific name recommendations (e.g. actual hotels, real tourist landmarks) instead of placeholders.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: "A short, vivid, inspiring overview of the trip (2-3 sentences) setting the stage for the traveler.",
              },
              budgetBreakdown: {
                type: Type.OBJECT,
                description: "Realistic cost estimation in USD that fits within the budget constraints.",
                properties: {
                  estimatedFlights: { type: Type.NUMBER, description: "Average roundtrip flight cost estimate." },
                  estimatedHotels: { type: Type.NUMBER, description: "Total hotel accommodation cost estimate for the trip." },
                  estimatedFood: { type: Type.NUMBER, description: "Total food and dining cost estimate." },
                  estimatedActivities: { type: Type.NUMBER, description: "Total estimated activities, tickets, and tours cost." },
                  estimatedTransport: { type: Type.NUMBER, description: "Total local transport (trains, cabs, subway) cost." },
                  estimatedEmergency: { type: Type.NUMBER, description: "A buffer amount for miscellaneous or emergency expenses." },
                },
                required: [
                  "estimatedFlights",
                  "estimatedHotels",
                  "estimatedFood",
                  "estimatedActivities",
                  "estimatedTransport",
                  "estimatedEmergency",
                ],
              },
              flights: {
                type: Type.ARRAY,
                description: "2 typical flight options/suggestions.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    airline: { type: Type.STRING, description: "Name of the airline (e.g. Air France, United Airlines)." },
                    typicalPrice: { type: Type.NUMBER, description: "Typical round-trip price in USD." },
                    duration: { type: Type.STRING, description: "Typical travel duration (e.g., '8h 15m (Non-stop)', '11h 40m (1 stop)')." },
                    layovers: { type: Type.STRING, description: "Layover information (e.g., 'Non-stop', '1 stop in London')." },
                    bookingTip: { type: Type.STRING, description: "Practical booking tip (e.g., 'Book 6 weeks in advance, Tuesday afternoons are cheapest')." },
                  },
                  required: ["airline", "typicalPrice", "duration", "layovers", "bookingTip"],
                },
              },
              hotels: {
                type: Type.ARRAY,
                description: "2-3 hotel recommendations aligned with the budget category.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Real, specific hotel name." },
                    rating: { type: Type.STRING, description: "Hotel star rating or score (e.g., '4-star boutique', '5-star luxury resort')." },
                    pricePerNight: { type: Type.NUMBER, description: "Average price per night in USD." },
                    area: { type: Type.STRING, description: "Neighborhood or area (e.g., 'Shibuya', 'The Latin Quarter')." },
                    whyItFits: { type: Type.STRING, description: "Why this fits the selected travel style and budget (1-2 sentences)." },
                    amenities: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Key amenities (e.g. Free Wi-Fi, Rooftop Bar, Breakfast included)."
                    },
                  },
                  required: ["name", "rating", "pricePerNight", "area", "whyItFits", "amenities"],
                },
              },
              itinerary: {
                type: Type.ARRAY,
                description: "A comprehensive day-by-day itinerary.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayNumber: { type: Type.INTEGER, description: "Day count (e.g., 1, 2, 3)." },
                    dayTitle: { type: Type.STRING, description: "Theme of the day (e.g. 'Historic Highlights & River Cruise')." },
                    activities: {
                      type: Type.ARRAY,
                      description: "Timeline of 3 key activities for the day (Morning, Afternoon, Evening).",
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          timeOfDay: { type: Type.STRING, description: "Must be exactly 'Morning', 'Afternoon', or 'Evening'." },
                          title: { type: Type.STRING, description: "Specific activity or sight name." },
                          description: { type: Type.STRING, description: "Intriguing, descriptive summary of what to see and do." },
                          location: { type: Type.STRING, description: "Name of the neighborhood or attraction." },
                          estimatedCost: { type: Type.NUMBER, description: "Estimated ticket cost in USD (0 if free)." },
                          transportTip: { type: Type.STRING, description: "How to reach this place (e.g. 'Metro Line 1 to Louvre, or 15-min walk')." },
                        },
                        required: ["timeOfDay", "title", "description", "location", "estimatedCost", "transportTip"],
                      },
                    },
                  },
                  required: ["dayNumber", "dayTitle", "activities"],
                },
              },
              attractions: {
                type: Type.ARRAY,
                description: "3-4 main tourist attractions or hidden local gems.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Attraction name." },
                    description: { type: Type.STRING, description: "Interesting history or visual highlights." },
                    cost: { type: Type.NUMBER, description: "Typical ticket price in USD (0 if free)." },
                    bestTime: { type: Type.STRING, description: "Optimal time or conditions to visit (e.g. 'Early morning for sunrise', 'Weekdays before 10 AM')." },
                  },
                  required: ["name", "description", "cost", "bestTime"],
                },
              },
              localTips: {
                type: Type.OBJECT,
                properties: {
                  weather: { type: Type.STRING, description: "Brief seasonal weather summary." },
                  packing: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "3-4 specific highly recommended items to pack."
                  },
                  safety: { type: Type.STRING, description: "Useful local guidelines, safety tips, or common tourist traps." },
                  phrases: {
                    type: Type.ARRAY,
                    description: "3-4 practical phrases with English meaning.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        english: { type: Type.STRING },
                        local: { type: Type.STRING, description: "Phrase in local language with phonetic guide in parentheses if useful." }
                      },
                      required: ["english", "local"],
                    }
                  }
                },
                required: ["weather", "packing", "safety", "phrases"],
              },
              localCurrencyCode: {
                type: Type.STRING,
                description: "The standard 3-letter currency code of the destination (e.g., EUR, JPY, GBP, INR, AUD, CAD, SGD, AED, etc.)."
              },
              typicalExchangeRate: {
                type: Type.NUMBER,
                description: "Typical exchange rate value: how many local currency units for 1 USD. e.g., if local currency is EUR, 0.92; if JPY, 155.0."
              },
              budgetAdvice: {
                type: Type.OBJECT,
                description: "AI evaluation of whether the specified budget limit is sufficient for this destination, style, and duration.",
                properties: {
                  isSufficient: { type: Type.BOOLEAN, description: "Whether the budgetLimit is sufficient for this trip." },
                  adequacyScore: { type: Type.NUMBER, description: "An adequacy score from 0 (completely insufficient) to 100 (abundantly sufficient)." },
                  adviceMessage: { type: Type.STRING, description: "Detailed, personalized and localized budgeting advice for this destination and category, explaining local cost realities and saving options." }
                },
                required: ["isSufficient", "adequacyScore", "adviceMessage"]
              },
              travelNews: {
                type: Type.ARRAY,
                description: "4-5 highly contextual, realistic travel news updates, warnings, weather reports, transit/entry alerts, or cultural event updates specifically relevant for tourists visiting this destination.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "A unique news article ID (e.g. news-1, alert-2)." },
                    title: { type: Type.STRING, description: "Catchy, highly realistic travel headline." },
                    category: { type: Type.STRING, description: "Must be one of: 'safety' (for advisories/warnings), 'event' (for festivals/closures), 'logistics' (for visa/transit), 'weather' (for weather alerts)." },
                    severity: { type: Type.STRING, description: "Must be one of: 'critical' (urgent warning/red), 'warning' (important precaution/orange), 'info' (helpful news/teal)." },
                    date: { type: Type.STRING, description: "A realistic date description (e.g. 'Current Alert', 'Recent Update', or dates near the trip)." },
                    content: { type: Type.STRING, description: "Detailed description of the news, closure, event, or warning." },
                    actionableAdvice: { type: Type.STRING, description: "An actionable suggestion for the tourist to safely navigate or benefit from this news." }
                  },
                  required: ["id", "title", "category", "severity", "date", "content", "actionableAdvice"]
                }
              }
            },
            required: [
              "summary",
              "budgetBreakdown",
              "flights",
              "hotels",
              "itinerary",
              "attractions",
              "localTips",
              "localCurrencyCode",
              "typicalExchangeRate",
              "budgetAdvice",
              "travelNews"
            ],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from the Gemini model.");
      }

      // Double-walled safety: Sanitize output text for any accidental reflections of personal information
      const { sanitizedText: sanitizedResponseText } = sanitizePIIText(responseText, clientEmail);

      const tripData = JSON.parse(sanitizedResponseText.trim());
      res.json(tripData);
    } catch (error: any) {
      console.error("Error in generate-trip API handler:", error);
      res.status(500).json({
        error: error?.message || "An unexpected error occurred while generating your travel itinerary. Please try again.",
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
