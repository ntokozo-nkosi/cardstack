import { NextResponse } from 'next/server';
import { getCurrentUserDb } from '@/lib/auth-helpers';
import { query } from '@/lib/database';

export async function GET() {
  try {
    const user = await getCurrentUserDb();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query('SELECT get_all_user_cards($1) as cards', [user.id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json([]);
    }
    
    const cards = result.rows[0].cards || [];
    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}