import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const client = new OpenAI({ apiKey });
const model = process.env.OPENAI_MODEL || 'gpt-5';

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not set' }, { status: 500 });
    }

    const body = await req.json();
    const reviews: any[] = Array.isArray(body?.reviews) ? body.reviews : [];
    if (!reviews.length) {
      return NextResponse.json({ error: 'No reviews provided' }, { status: 400 });
    }

    // Simple in-memory cache (scoped to Vercel lambda instance)
    // Cache key is a hash of first/last few review texts for stability
    const keySource = reviews.slice(0, 5).map((r: any) => (r.text || r.comment || '')).join('|') + '::' + reviews.slice(-5).map((r: any) => (r.text || r.comment || '')).join('|');
    const key = `sum:${Buffer.from(keySource).toString('base64').slice(0, 64)}`;
    // @ts-ignore
    const globalAny: any = globalThis as any;
    globalAny.__SUM_CACHE__ = globalAny.__SUM_CACHE__ || new Map<string, { data: any; ts: number }>();
    const ttlMs = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    const cached = globalAny.__SUM_CACHE__.get(key);
    if (cached && (now - cached.ts) < ttlMs) {
      return NextResponse.json(cached.data, { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=3600' } });
    }

    const textSample = reviews
      .slice(0, 400)
      .map((r: any) => (typeof r === 'string' ? r : r.comment || r.text || JSON.stringify(r)))
      .join('\n\n');

    const prompt = `ROLE: You are a senior LiveOps strategist for mobile F2P games. STRICT SCOPE: Consider ONLY LiveOps levers: events (cadence/design/variety), offers/pricing/discounts, bundles, time-limited shops, A/B tests and experiments, login streaks, rewards/loot fairness, currencies and sinks, progression/XP pacing, difficulty spikes tied to monetization, engagement loops (dailies, weeklies, missions), returner flows, pass/battle pass tuning, server stability of live features, live updates cadence/communication. DO NOT include crashes, bugs, camera, hardware, or non-LiveOps tech issues.\n\nTASK: From the reviews, extract LiveOps problems. If a review is non-LiveOps, ignore it.\n\nOUTPUT JSON ONLY (no prose): {\n  "problems": [ { "title": string, "description": string, "severity": 1|2|3|4|5 } ],\n  "summaryLine": string,\n  "totalAnalyzed": number\n}\n\nRULES:\n- Map sentiment and frequency to severity (5 = pervasive/harmful to retention/revenue).\n- Titles <= 6 words; descriptions <= 220 chars.\n- summaryLine: ONE sentence summarizing the LiveOps migraine themes.\n- totalAnalyzed = count of reviews received.\n\nREVIEWS:\n${textSample}`;

    let response;
    try {
      response = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 700
      });
    } catch (err: any) {
      // Fallback to a widely available model if the requested one is not allowed
      const fallbackModel = 'gpt-4o-mini';
      console.error('Primary model failed:', err?.message);
      response = await client.chat.completions.create({
        model: fallbackModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 700
      });
    }

    const content = response.choices[0]?.message?.content || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      // attempt to extract JSON substring
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { problems: [], summaryLine: '', totalAnalyzed: reviews.length };
    }

    if (!Array.isArray(parsed.problems)) parsed.problems = [];
    // LiveOps-only guard: drop problems that mention crash/bug/camera/device/UI etc
    const nonLiveOpsPattern = /(crash|bug|camera|device|hardware|ui|interface|performance|white screen|recognize|sensor|bluetooth)/i;
    parsed.problems = parsed.problems.filter((p: any) => p?.title && p?.description && !nonLiveOpsPattern.test(`${p.title} ${p.description}`));
    // Always set totalAnalyzed to the actual number provided to this request
    parsed.totalAnalyzed = reviews.length;
    if (!parsed.summaryLine || typeof parsed.summaryLine !== 'string' || !parsed.summaryLine.trim()) {
      const top = parsed.problems.slice(0, 3).map((p: any) => p.title).filter(Boolean).join(', ');
      parsed.summaryLine = top ? top : 'LiveOps issues detected based on user feedback.';
    }

    const responseBody = { ...parsed };
    globalAny.__SUM_CACHE__.set(key, { data: responseBody, ts: now });
    return NextResponse.json(responseBody, { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=3600' } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Summarization failed' }, { status: 500 });
  }
}


