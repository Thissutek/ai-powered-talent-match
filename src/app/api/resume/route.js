// src/app/api/resume/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { parseResume } from '@/lib/resume-parser';

export async function POST(request) {
  try {
    // Create a direct Supabase client without auth (using service role)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Create a Supabase client without auth persistence to avoid cookie issues
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    
    const { candidateId, filePath, fileName } = await request.json();

    if (!candidateId || !filePath || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Processing resume for candidate:', candidateId);
    console.log('File path:', filePath);

    // Download file from Supabase storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      return NextResponse.json(
        { error: `Failed to download file: ${downloadError.message}` },
        { status: 500 }
      );
    }

    console.log('Resume downloaded successfully, parsing content...');

    // Parse resume content
    const { text, skills, education, experience, contactInfo, vector } = await parseResume(fileData);

    console.log('Resume parsed successfully');
    console.log('Extracted skills:', skills);

    // Save resume to database - use a simplified insert to avoid issues
    const { data: resumeData, error: resumeError } = await supabase
      .from('resumes')
      .insert({
        candidate_id: candidateId,
        file_path: filePath,
        file_name: fileName,
        content_text: text
        // Omitting content_vector temporarily to simplify
      })
      .select('id')
      .single();

    if (resumeError) {
      console.error('Resume insert error:', resumeError);
      return NextResponse.json({
        // Still return the parsed data even if DB insert failed
        id: null,
        candidateId,
        filePath,
        fileName,
        skills,
        education,
        experience,
        contactInfo,
        error: `Database error: ${resumeError.message}`
      });
    }

    // Return the parsed data
    return NextResponse.json({
      id: resumeData?.id || null,
      candidateId,
      filePath,
      fileName,
      skills,
      education,
      experience,
      contactInfo
    });
    
  } catch (error) {
    console.error('Resume processing error:', error);
    return NextResponse.json(
      { error: `Failed to process resume: ${error.message}` },
      { status: 500 }
    );
  }
}