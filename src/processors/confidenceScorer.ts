export class ConfidenceScorer {
  calculate(analysis: any) {
    let score = 0;
    score += Math.min(analysis.orderBlocks * 20, 40);
    score += Math.min(analysis.fvgs * 15, 35);
    score += Math.min(analysis.bos * 25, 25);

    score = Math.min(Math.max(score, 0), 100);

    return {
      score: Math.floor(score),
      level: score < 35 ? 'ضعیف' : score < 60 ? 'خنثی' : score < 85 ? 'قابل قبول' : 'قوی',
      hasSetup: score >= 85
    };
  }
}
