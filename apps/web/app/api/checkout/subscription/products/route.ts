import { NextResponse } from 'next/server';
import { creem } from '@/lib/creem';

export const revalidate = 3600;

export async function GET() {
  try {
    const data = await creem.products.list({ limit: 100 });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch products from Creem API:", error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
