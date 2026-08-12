import { NextRequest, NextResponse } from "next/server";

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

function isMarketOpen(): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  // Weekend check
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }
  
  // US Eastern Time market hours (9:30 AM - 4:00 PM ET)
  // Convert to UTC: 13:30 - 20:00 UTC
  const nowUTC = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  const hour = nowUTC.getUTCHours();
  const minute = nowUTC.getUTCMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  return timeInMinutes >= 800 && timeInMinutes <= 1200;
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    
    if (!apiKey || apiKey === "your_api_key_here") {
      return NextResponse.json(
        { 
          error: "Finnhub API key not configured. Set FINNHUB_API_KEY in .env.local",
          data: [],
          isMarketOpen: false,
          lastUpdated: new Date().toISOString()
        },
        { status: 200 }
      );
    }

    const marketOpen = isMarketOpen();
    
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
    
    return NextResponse.json(
      { 
        error: "Failed to fetch market data",
        data: [],
        isMarketOpen: false,
        lastUpdated: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}