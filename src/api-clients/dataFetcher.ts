import axios from 'axios';

interface Candle {
  timestamp: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}

interface TimeframeData {
  timeframe: string;
  candles: Candle[];
}

export interface MarketData {
  symbol: string;
  currentPrice: number;
  timeframes: TimeframeData[];
}

export class DataFetcher {
  private binanceUrl = 'https://api.binance.com/api/v3';
  private cache = new Map<string, { data: MarketData; time: number }>();
  private CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  async fetchMultiTimeframe(symbol: string, market: string): Promise<MarketData | null> {
    const key = `${symbol}:${market}`;
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.time < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      if (market === 'crypto') {
        return await this.fetchCrypto(symbol);
      } else {
        return await this.fetchForex(symbol);
      }
    } catch (error) {
      console.error(`Fetch error for ${symbol}:`, error);
      return cached?.data || null;
    }
  }

  private async fetchCrypto(symbol: string): Promise<MarketData | null> {
    try {
      const [price, candles15, candles1h] = await Promise.all([
        axios.get(`${this.binanceUrl}/ticker/price`, { params: { symbol } }),
        axios.get(`${this.binanceUrl}/klines`, { params: { symbol, interval: '15m', limit: 20 } }),
        axios.get(`${this.binanceUrl}/klines`, { params: { symbol, interval: '1h', limit: 20 } })
      ]);

      const currentPrice = parseFloat(price.data.price);
      const tf15 = candles15.data.map((k: any[]) => ({ timestamp: k[0], close: parseFloat(k[4]), high: parseFloat(k[2]), low: parseFloat(k[3]), volume: parseFloat(k[7]) }));
      const tf1h = candles1h.data.map((k: any[]) => ({ timestamp: k[0], close: parseFloat(k[4]), high: parseFloat(k[2]), low: parseFloat(k[3]), volume: parseFloat(k[7]) }));

      const data: MarketData = {
        symbol,
        currentPrice,
        timeframes: [
          { timeframe: '15m', candles: tf15 },
          { timeframe: '1h', candles: tf1h }
        ]
      };

      this.cache.set(`${symbol}:crypto`, { data, time: Date.now() });
      return data;
    } catch (error) {
      console.error('Crypto fetch error:', error);
      return null;
    }
  }

  private async fetchForex(symbol: string): Promise<MarketData> {
    // Mock data for forex (optimize API calls)
    const mockPrice = 2180 + Math.random() * 50;
    const candles = this.generateCandles(20);

    const data: MarketData = {
      symbol,
      currentPrice: mockPrice,
      timeframes: [
        { timeframe: '15m', candles },
        { timeframe: '1h', candles: candles.slice(0, 10) }
      ]
    };

    this.cache.set(`${symbol}:forex`, { data, time: Date.now() });
    return data;
  }

  private generateCandles(count: number): Candle[] {
    const candles: Candle[] = [];
    let price = 2150;

    for (let i = 0; i < count; i++) {
      const change = (Math.random() - 0.5) * 5;
      const close = price + change;
      const high = Math.max(price, close) + Math.random() * 2;
      const low = Math.min(price, close) - Math.random() * 2;

      candles.push({
        timestamp: Date.now() - (count - i) * 60000,
        close,
        high,
        low,
        volume: Math.random() * 100000
      });
      price = close;
    }
    return candles;
  }
}
