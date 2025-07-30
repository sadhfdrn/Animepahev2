import { NextResponse } from 'next/server';
import AnimePahe from '@/lib/consumet/anime/animepahe';

export async function GET(
  request: Request,
  { params }: { params: { episodeId: string[] } }
) {
  try {
    const animepahe = new AnimePahe();
    const episodeId = params.episodeId.join('/');
    const data = await animepahe.fetchEpisodeSources(episodeId);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
