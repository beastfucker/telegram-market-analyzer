export interface AnalysisResult {
  orderBlocks: number;
  fvgs: number;
  bos: number;
  support: number;
  resistance: number;
  summary: string;
  reasons: string[];
}

export class SMCAnalyzer {
  async analyze(data: any, symbol: string, market: string): Promise<AnalysisResult> {
    let obCount = 0, fvgCount = 0, bosCount = 0;
    let support = Infinity, resistance = 0;

    for (const tf of data.timeframes) {
      const candles = tf.candles;
      
      // Order Blocks
      for (let i = 1; i < candles.length; i++) {
        if (Math.abs(candles[i].close - candles[i - 1].close) > candles[i - 1].close * 0.001) {
          obCount++;
        }
      }

      // Fair Value Gaps
      for (let i = 1; i < candles.length; i++) {
        const gap = Math.abs(candles[i].high - candles[i - 1].low);
        if (gap > 0.002 * candles[i].close) fvgCount++;
      }

      // Break of Structure
      if (candles.length > 2) {
        bosCount += candles[candles.length - 1].close > Math.max(candles[candles.length - 2].high, candles[candles.length - 3].high) ? 1 : 0;
      }

      support = Math.min(support, ...candles.map(c => c.low));
      resistance = Math.max(resistance, ...candles.map(c => c.high));
    }

    const summary = obCount + fvgCount > 0 ? 'ساختار بازار درحال تشکیل است' : 'قیمت در رنج حاضر قرار دارد';
    const reasons = [
      obCount > 0 ? '✓ اورد بلاک شناسایی' : '✗ اورد بلاک ناپیدا',
      fvgCount > 0 ? '✓ منطقه FVG یافت' : '✗ منطقه FVG ندارد',
      'ریسک/ریوارد نامناسب'
    ];

    return { orderBlocks: obCount, fvgs: fvgCount, bos: bosCount, support, resistance, summary, reasons };
  }
}
