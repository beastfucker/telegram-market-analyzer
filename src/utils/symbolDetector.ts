interface DetectionResult {
  found: boolean;
  symbol?: string;
  market?: 'crypto' | 'forex';
}

export class SymbolDetector {
  private patterns = {
    crypto: /\b(BTCUSDT|ETHUSDT|BNBUSDT|SOLUSDT|XRPUSDT|ADAUSDT)\b/gi,
    forex: /\b(EURUSD|GBPUSD|USDJPY|XAUUSD|XAGUSD)\b/gi
  };

  detect(text: string): DetectionResult {
    const upper = text.toUpperCase();
    
    let match = upper.match(this.patterns.crypto);
    if (match) return { found: true, symbol: match[0], market: 'crypto' };

    match = upper.match(this.patterns.forex);
    if (match) return { found: true, symbol: match[0], market: 'forex' };

    return { found: false };
  }
}
