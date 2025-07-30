import { NextResponse } from 'next/server';
import AnimePahe from '@/lib/consumet/anime/animepahe';

export async function GET(
  request: Request,
  { params }: { params: { query: string } }
) {
  try {
    const animepahe = new AnimePahe();
    const query = params.query;
    const data = await animepahe.search(query);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
