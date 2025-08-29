import { NextResponse } from 'next/server';
import * as gplay from 'google-play-scraper';

type Params = { params: { bundleId: string } };

export async function GET(_req: Request, { params }: Params) {
  const { bundleId } = params;
  try {
    const app = await gplay.app({ appId: bundleId, throttle: 1 });
    return NextResponse.json({
      title: app.title,
      summary: app.summary,
      score: app.score,
      installs: app.installs,
      icon: app.icon,
      developer: app.developer,
      url: app.url
    }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch' }, { status: 500 });
  }
}


