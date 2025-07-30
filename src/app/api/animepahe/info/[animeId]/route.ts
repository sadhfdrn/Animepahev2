import { NextResponse } from 'next/server';
import AnimePahe from '@/lib/consumet/anime/animepahe';

export async function GET(
  request: Request,
  { params }: { params: { animeId: string } }
) {
  try {
    const animepahe = new AnimePahe();
    const animeId = params.animeId;
    const data = await animepahe.fetchAnimeInfo(animeId);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
