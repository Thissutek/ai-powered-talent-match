// src/app/api/chat/route.js
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';
import { LLMChain } from 'langchain/chains';

const model = new OpenAI({
  temperature: 0.7,
  modelName: 'gpt-4',
  openAIApiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { sessionId, candidateId, message, resumeData } = await request.json();

    if (!sessionId || !candidateId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get previous messages from this session
    const { data: previousMessages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('sender, content')
      .eq('session_id', sessionId)
      .order('sent_at', { ascending: true });

    if (messagesError) {
      return NextResponse.json(
        { error: `Failed to retrieve messages: ${messagesError.message}` },
        { status: 500 }
      );
    }

    // Format conversation history
    const conversationHistory = previousMessages
      .map((msg) => `${msg.sender === 'ai' ? 'Assistant' : 'Candidate'}: ${msg.content}`)
      .join('\n\n');

    // Get candidate skills from database
    const { data: candidateSkills, error: skillsError } = await supabase
      .from('candidate_skills')
      .select('skills(name), proficiency, source')
      .eq('candidate_id', candidateId);

    if (skillsError) {
      return NextResponse.json(
        { error: `Failed to retrieve skills: ${skillsError.message}` },
        { status: 500 }
      );
    }

    // Format skills
    const skills = candidateSkills.map((item) => ({
      name: item.skills.name,
      proficiency: item.proficiency,
      source: item.source
    }));

    // Create a prompt template for the AI
    const template = `
    You are an AI recruiter assistant conducting an interview with a job candidate. You are helpful, friendly, but also thorough in your assessment.

    Candidate Resume Information:
    ${JSON.stringify(resumeData || {})}

    Candidate Skills:
    ${JSON.stringify(skills || [])}

    Previous Conversation:
    ${conversationHistory}

    Candidate's most recent message: ${message}

    Your task is to:
    1. Ask relevant questions to assess the candidate's skills, experience, and fit
    2. Dig deeper into their experience with follow-up questions
    3. Focus on technical skills relevant to their field
    4. Evaluate soft skills through conversational cues
    5. Be friendly and encouraging while still gathering useful information

    Your response should:
    - Not be too long (1-3 paragraphs)
    - Include