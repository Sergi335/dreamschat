import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Test simple query
    const { data, error } = await supabase
      .from('conversations')
      .select('count')
      .eq('user_id', userId);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { 
          error: 'Database error', 
          details: error.message,
          hint: error.hint,
          code: error.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      userId,
      data,
      env: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    });
  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    );
  }
}
