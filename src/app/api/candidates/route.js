// src/app/api/candidates/route.js
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('No session found in API route');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const candidateData = await request.json();
    
    // Add the user_id to the candidate data
    candidateData.user_id = session.user.id;

    console.log('Creating candidate with data:', candidateData);

    // Insert the candidate
    const { data, error } = await supabase
      .from('candidates')
      .insert(candidateData)
      .select()
      .single();

    if (error) {
      console.log('Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('Candidate created successfully:', data);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error creating candidate:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}