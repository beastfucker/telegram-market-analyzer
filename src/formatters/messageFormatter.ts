export class MessageFormatter {
  format(input: any): string {
    const { symbol, price, analysis, score } = input;

    let msg = `<b>📊 تحلیل | ${symbol}</b>\n`;
    msg += `<b>${price.toFixed(2)}</b>\n\n`;
    msg += `<b>1H · SMC/Liquidity</b>\n\n`;
    msg += `<b>خلاصه:</b>\n${analysis.summary}\n\n`;
    msg += `<b>دلایل:</b>\n`;
    for (const reason of analysis.reasons) {
      msg += `• ${reason}\n`;
    }
    msg += `\n<b>موج بعدی:</b>\n`;
    msg += `• حمایت: <code>${analysis.support.toFixed(2)}</code>\n`;
    msg += `• مقاومت: <code>${analysis.resistance.toFixed(2)}</code>\n\n`;
    msg += `<b>Score ${score.score}/100 · ${score.hasSetup ? '✅ SETUP' : '❌ No Setup'}</b>\n`;
    msg += `⚠️ Educational only`;

    return msg;
  }
}
