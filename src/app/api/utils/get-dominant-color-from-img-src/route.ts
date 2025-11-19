import { NextRequest, NextResponse } from 'next/server';
import { Vibrant } from 'node-vibrant/node';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imgUrl = searchParams.get('imgUrl');
    if (!imgUrl) {
      return NextResponse.json({ error: 'Missing imgUrl parameter' }, { status: 400 });
    }

    const v = new Vibrant(imgUrl);
    const palette = await v.getPalette();
    const hex = palette.Vibrant?.hex;

    return NextResponse.json({ color: hex });
  } catch (e) {
    console.error('Error extracting dominant color:', e);
    return NextResponse.json({ error: 'Failed to extract color' }, { status: 500 });
  }
}
