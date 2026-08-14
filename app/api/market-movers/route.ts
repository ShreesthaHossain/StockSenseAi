import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface MarketMover {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
}

interface FinnhubQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
}

interface FinnhubStock {
  symbol: string;
  description: string;
}

// Major US stocks to track
const MAJOR_STOCKS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "META",
  "NVDA", "TSLA", "JPM", "V", "WMT",
  "JNV", "UNH", "HD", "DIS", "PYPL",
  "BAC", "ADBE", "CRM", "NFLX", "INTC"
];

// Fallback market movers data to display when API key is missing, invalid, or rate-limited
const FALLBACK_MOVERS: MarketMover[] = [
  { ticker: "TSLA", price: 218.50, change: 12.40, changePercent: 6.02 },
  { ticker: "NVDA", price: 124.80, change: 5.60, changePercent: 4.70 },
  { ticker: "AAPL", price: 178.20, change: -4.30, changePercent: -2.36 },
  { ticker: "MSFT", price: 415.50, change: 3.10, changePercent: 0.75 },
  { ticker: "AMZN", price: 185.10, change: -1.90, changePercent: -1.02 },
  { ticker: "META", price: 495.20, change: 8.90, changePercent: 1.83 },
  { ticker: "GOOGL", price: 168.40, change: -2.10, changePercent: -1.23 },
  { ticker: "NFLX", price: 610.30, change: 14.50, changePercent: 2.43 },
  { ticker: "DIS", price: 112.40, change: -3.20, changePercent: -2.77 },
  { ticker: "JPM", price: 195.80, change: 2.40, changePercent: 1.24 }
];

function isMarketOpen(): boolean {
  const now = new Date();
  
  // Convert current time to US Eastern Time (ET)
  const etString = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  const etDate = new Date(etString);
  
  const dayOfWeek = etDate.getDay(); // 0 (Sun) to 6 (Sat)
  const hour = etDate.getHours();
  const minute = etDate.getMinutes();
  const timeInMinutes = hour * 60 + minute;

  // Weekend check (Saturday = 6, Sunday = 0)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  // US Market Hours: 9:30 AM (570 min) to 4:00 PM (960 min) ET
  return timeInMinutes >= 570 && timeInMinutes < 960;
}

export async function GET(request: NextRequest) {
  const marketOpen = isMarketOpen();

  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    
    if (!apiKey || apiKey === "your_api_key_here") {
      return NextResponse.json({ 
        error: "Finnhub API key not configured in deployment settings. Showing fallback data.",
        data: FALLBACK_MOVERS,
        isMarketOpen: marketOpen,
        lastUpdated: new Date().toISOString()
      });
    }

    // Fetch quotes for all stocks
    const quotes = await Promise.all(
      MAJOR_STOCKS.map(async (symbol) => {
        try {
          const response = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
            { next: { revalidate: marketOpen ? 30 : 300 } }
          );
          
          if (!response.ok) {
            return null;
          }
          
          const data = (await response.json()) as FinnhubQuote;
          
          if (data.c === 0) {
            return null;
          }
          
          return {
            ticker: symbol,
            price: data.c,
            change: data.d,
            changePercent: data.dp
          };
        } catch {
          return null;
        }
      })
    );

    // Filter out failed requests and sort by absolute percentage change
    const validQuotes = quotes.filter((q): q is MarketMover => q !== null);
    
    // If API returned no results (e.g. rate limit), use fallback data
    if (validQuotes.length === 0) {
      return NextResponse.json({
        error: "Finnhub API rate limited or returned empty results. Showing fallback data.",
        data: FALLBACK_MOVERS,
        isMarketOpen: marketOpen,
        lastUpdated: new Date().toISOString()
      });
    }
    
    // Sort by absolute percentage change (biggest movers)
    const sortedQuotes = validQuotes.sort((a, b) => 
      Math.abs(b.changePercent) - Math.abs(a.changePercent)
    );

    // Take top 10
    const topMovers = sortedQuotes.slice(0, 10);

    const response = NextResponse.json({
      data: topMovers,
      isMarketOpen: marketOpen,
      lastUpdated: new Date().toISOString()
    });

    // Cache headers
    response.headers.set("Cache-Control", marketOpen 
      ? "public, max-age=30, stale-while-revalidate=30" 
      : "public, max-age=300, stale-while-revalidate=60"
    );
    response.headers.set("Vary", "Accept-Encoding");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");

    return response;
  } catch (error) {
    console.error("Market movers error:", error);
    
    return NextResponse.json({ 
      error: "Failed to fetch market data. Showing fallback data.",
      data: FALLBACK_MOVERS,
      isMarketOpen: marketOpen,
      lastUpdated: new Date().toISOString()
    });
  }
}
