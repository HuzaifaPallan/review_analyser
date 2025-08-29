import { NextResponse } from 'next/server';
import gplay from 'google-play-scraper';

type Params = { params: { bundleId: string } };

export async function GET(request: Request, { params }: Params) {
  const { bundleId } = params;
  const { searchParams } = new URL(request.url);
  const max = Math.min(parseInt(searchParams.get('max') || '100', 10), 100);
  const sort = (searchParams.get('sort') || 'newest') as 'newest' | 'most_relevant';
  const sortMap = {
    newest: gplay.sort.NEWEST,
    most_relevant: gplay.sort.RATING
  } as const;

  try {
    const reviews = await gplay.reviews({
      appId: bundleId,
      sort: sortMap[sort] ?? gplay.sort.NEWEST,
      num: max
    });

    return NextResponse.json({
      reviews: reviews.data
    }, { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch reviews' }, { status: 500 });
  }
}


