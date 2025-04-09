// src/app/api/resume/route.js
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { parseResume } from '@/lib/resume-parser';

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { candidateId, filePath, fileName, fileUrl } = await request.json();

    if (!candidateId || !filePath || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Download file from Supabase storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(filePath);

    if (downloadError) {
      return NextResponse.json(
        { error: `Failed to download file: ${downloadError.message}` },
        { status: 500 }
      );
    }

    // Parse resume content
    const { text, skills, education, experience, contactInfo, vector } = await parseResume(fileData);

    // Save resume to database
    const { data: resumeData, error: resumeError } = await supabase
      .from('resumes')
      .insert({
        candidate_id: candidateId,
        file_path: filePath,
        file_name: fileName,
        content_text: text,
        content_vector: vector
      })
      .select('id')
      .single();

    if (resumeError) {
      return NextResponse.json(
        { error: `Failed to save resume: ${resumeError.message}` },
        { status: 500 }
      );
    }

    // Save skills
    for (const skill of skills) {
      // Check if skill exists
      let { data: skillData } = await supabase
        .from('skills')
        .select('id')
        .eq('name', skill.toLowerCase())
        .single();

      // Create skill if it doesn't exist
      if (!skillData) {
        const { data: newSkill, error: skillError } = await supabase
          .from('skills')
          .insert({ name: skill.toLowerCase() })
          .select('id')
          .single();

        if (skillError) continue;
        skillData = newSkill;
      }

      // Associate skill with candidate
      await supabase.from('candidate_skills').insert({
        candidate_id: candidateId,
        skill_id: skillData.id,
        proficiency: 3, // Default proficiency
        source: 'resume'
      });
    }

    // Generate initial scores based on resume
    await supabase.from('scores').insert([
      {
        candidate_id: candidateId,
        category: 'skills_relevance',
        score: 0, // Will be calculated later
        notes: 'Initial score based on resume',
        created_by: 'ai'
      },
      {
        candidate_id: candidateId,
        category: 'experience',
        score: 0, // Will be calculated later
        notes: 'Initial score based on resume',
        created_by: 'ai'
      }
    ]);

    return NextResponse.json({
      id: resumeData.id,
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