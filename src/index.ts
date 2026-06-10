import { Telegraf, Context } from 'telegraf';
import dotenv from 'dotenv';
import { SymbolDetector } from './utils/symbolDetector.js';
import { DataFetcher } from './api-clients/dataFetcher.js';
import { SMCAnalyzer } from './analyzers/smcAnalyzer.js';
import { ConfidenceScorer } from './processors/confidenceScorer.js';
import { MessageFormatter } from './formatters/messageFormatter.js';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('❌ TELEGRAM_BOT_TOKEN not set');

const bot = new Telegraf<Context>(token);
const detector = new SymbolDetector();
const fetcher = new DataFetcher();
const analyzer = new SMCAnalyzer();
const scorer = new ConfidenceScorer();
const formatter = new MessageFormatter();

const activeUsers = new Map<number, Date>();
const MAX_CONCURRENT = 5;

bot.on('message', async (ctx) => {
  try {
    const userId = ctx.from?.id;
    const text = (ctx.message as any).text || '';
    
    // Check rate limit
    if (activeUsers.has(userId!) && Date.now() - activeUsers.get(userId!)!.getTime() < 2000) {
      await ctx.reply('⏳ صبر کن 2 ثانیه...');
      return;
    }

    const detected = detector.detect(text);
    if (!detected.found) return;

    const { symbol, market } = detected;
    const loading = await ctx.reply(`⏳ تحلیل ${symbol}...`);
    activeUsers.set(userId!, new Date());

    try {
      const startTime = Date.now();
      const data = await fetcher.fetchMultiTimeframe(symbol, market!);
      
      if (!data) {
        await ctx.telegram.editMessageText(ctx.chat!.id, loading.message_id, undefined, `❌ خطا: نتوانستم ${symbol} را دریافت کنم`);
        return;
      }

      const analysis = await analyzer.analyze(data, symbol, market!);
      const score = scorer.calculate(analysis);
      const message = formatter.format({ symbol, market: market!, price: data.currentPrice, analysis, score });
      const elapsed = Date.now() - startTime;

      await ctx.deleteMessage(loading.message_id);
      await ctx.reply(message, { parse_mode: 'HTML' });
      console.log(`✅ ${symbol} analyzed in ${elapsed}ms`);
    } catch (innerError) {
      console.error('Inner error:', innerError);
      await ctx.telegram.editMessageText(ctx.chat!.id, loading.message_id, undefined, '❌ خطا در تحلیل. لطفا دوبارهتلاش کنید.');
    } finally {
      activeUsers.delete(userId!);
    }
  } catch (error) {
    console.error('Error:', error);
    await ctx.reply('❌ خطای داخلی. لطفا دوبارهتلاش کنید.');
  }
});

bot.launch();
console.log('🤖 Bot is running...');
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
