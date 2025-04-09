// src/app/actions.js
'use server';

import { createClient } from '@supabase/supabase-js';

export async function createCandidate(candidateData) {
  try {
    // Create a direct Supabase client with service role to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Create client with service role if available, otherwise use anon key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    
    // No auth check, we're using direct insert with service role
    console.log('Inserting candidate:', candidateData);
    
    // Removing any user_id to avoid potential conflicts
    const { user_id, ...dataToInsert } = candidateData;
    
    // Insert the candidate directly
    const { data, error } = await supabase
      .from('candidates')
      .insert(dataToInsert)
      .select()
      .single();
      
    if (error) {
      console.error('Error inserting candidate:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
    
    return { 
      success: true, 
      data 
    };
  } catch (error) {
    console.error('Unexpected error creating candidate:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}