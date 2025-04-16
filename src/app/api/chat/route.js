// src/app/api/chat/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Simple cache for development
const responseCache = new Map();

export async function POST(request) {
  try {
    // Create a direct Supabase client without auth (using service role)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    
    const { sessionId, candidateId, message, resumeData } = await request.json();

    if (!sessionId || !candidateId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get previous messages to maintain context
    const { data: previousMessages } = await supabase
      .from('chat_messages')
      .select('sender, content')
      .eq('session_id', sessionId)
      .order('sent_at', { ascending: true });
    
    // Store the message
    await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        sender: 'candidate',
        content: message
      });
    
    // Get candidate skills
    const { data: candidateSkills } = await supabase
      .from('candidate_skills')
      .select('skills(name), proficiency')
      .eq('candidate_id', candidateId);
    
    // Cache key for development
    const cacheKey = JSON.stringify({
      previousMessages: previousMessages?.length || 0,
      message
    });
    
    // Check cache (for development only)
    if (process.env.NODE_ENV === 'development' && responseCache.has(cacheKey)) {
      console.log("Using cached response");
      const cachedResponse = responseCache.get(cacheKey);
      
      // Still save the AI response in the database
      await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender: 'ai',
          content: cachedResponse.message
        });
      
      return NextResponse.json(cachedResponse);
    }
    
    // Generate AI response with context-aware interviewing
    let aiResponse;
    let updateScores = false;
    
    // Count previous messages to determine interview stage
    const messageCount = (previousMessages?.length || 0) + 1;
    
    if (messageCount <= 2) {
      // Introduction and first question
      aiResponse = `Thanks for joining this interview! I see you have experience with ${
        resumeData?.skills?.slice(0, 3).join(', ') || 'various technologies'
      }. Could you tell me more about your most recent role at ${
        resumeData?.experience?.[0]?.company || 'your current company'
      }?`;
    } else if (messageCount <= 4) {
      // Skills deep dive
      aiResponse = `That's interesting! I noticed ${
        resumeData?.skills?.[0] || 'technical skills'
      } on your resume. Can you share a specific project where you applied these skills and what was the outcome?`;
    } else if (messageCount <= 6) {
      // Challenge question
      aiResponse = `Thanks for sharing that. Let's talk about problem-solving: Can you describe a challenging technical issue you faced and how you resolved it?`;
    } else if (messageCount <= 8) {
      // Team collaboration
      aiResponse = `Great example! Now I'd like to understand your collaboration style. Can you tell me about a time when you had to work with a difficult team member or stakeholder?`;
    } else {
      // Wrap up and scoring
      aiResponse = `Thank you for all your detailed responses! I have enough information to complete your assessment. Your interview responses show good communication skills and technical depth. Is there anything else you'd like to add about your experiences?`;
      updateScores = true;
    }
    
    // Save response
    await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        sender: 'ai',
        content: aiResponse
      });
    
    // Generate mock scores if we're ready to update
    if (updateScores) {
      const scores = [
        {
          candidate_id: candidateId,
          category: 'technical_skills',
          score: Math.round(60 + Math.random() * 30), // Random score between 60-90
          notes: 'Based on technical discussion during interview',
          created_by: 'ai'
        },
        {
          candidate_id: candidateId,
          category: 'communication',
          score: Math.round(70 + Math.random() * 20), // Random score between 70-90
          notes: 'Evaluation of communication clarity and effectiveness',
          created_by: 'ai'
        },
        {
          candidate_id: candidateId,
          category: 'problem_solving',
          score: Math.round(65 + Math.random() * 25), // Random score between 65-90
          notes: 'Based on problem-solving examples provided',
          created_by: 'ai'
        },
        {
          candidate_id: candidateId,
          category: 'team_collaboration',
          score: Math.round(75 + Math.random() * 15), // Random score between 75-90
          notes: 'Assessment of teamwork and collaboration abilities',
          created_by: 'ai'
        },
        {
          candidate_id: candidateId,
          category: 'overall_potential',
          score: Math.round(70 + Math.random() * 20), // Random score between 70-90
          notes: 'Overall assessment based on interview and resume',
          created_by: 'ai'
        }
      ];
      
      // Insert the scores
      await supabase.from('scores').insert(scores);
      
      // Update the chat session to mark it as complete
      await supabase
        .from('chat_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId);
    }
    
    // Prepare response
    const result = {
      message: aiResponse,
      updateScores
    };
    
    // Cache the response for development
    if (process.env.NODE_ENV === 'development') {
      responseCache.set(cacheKey, result);
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        error: `Failed to process message: ${error.message}`,
        message: "I'm sorry, I encountered an error processing your message. Could you try again?",
        updateScores: false
      },
      { status: 500 }
    );
  }
}