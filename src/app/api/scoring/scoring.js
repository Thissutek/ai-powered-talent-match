// src/app/api/scoring/route.js
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';
import { LLMChain } from 'langchain/chains';

const model = new OpenAI({
  temperature: 0,
  modelName: 'gpt-4',
  openAIApiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { candidateId, sessionId } = await request.json();

    if (!candidateId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get resume data
    const { data: resumeData, error: resumeError } = await supabase
      .from('resumes')
      .select('content_text')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (resumeError) {
      return NextResponse.json(
        { error: `Failed to retrieve resume: ${resumeError.message}` },
        { status: 500 }
      );
    }

    // Get chat messages
    const { data: chatMessages, error: chatError } = await supabase
      .from('chat_messages')
      .select('sender, content')
      .eq('session_id', sessionId)
      .order('sent_at', { ascending: true });

    if (chatError) {
      return NextResponse.json(
        { error: `Failed to retrieve chat messages: ${chatError.message}` },
        { status: 500 }
      );
    }

    // Get assessments from chat
    const { data: assessments, error: assessmentsError } = await supabase
      .from('chat_assessments')
      .select('*')
      .eq('session_id', sessionId);

    if (assessmentsError) {
      console.error('Error retrieving assessments:', assessmentsError);
      // Continue anyway as this might be optional
    }

    // Format conversation for the AI
    const conversation = chatMessages
      .map((msg) => `${msg.sender.toUpperCase()}: ${msg.content}`)
      .join('\n\n');

    // Create a prompt template for scoring
    const template = `
    You are an AI recruiter tasked with evaluating job candidates. Based on the candidate's resume and interview conversation, provide a comprehensive evaluation.

    Resume:
    ${resumeData.content_text}

    Interview Conversation:
    ${conversation}

    Previous Assessments (if available):
    ${JSON.stringify(assessments || [])}

    Please evaluate the candidate in the following categories, with scores from 0-100:

    1. Technical Skills (relevance and depth of technical expertise)
    2. Experience (quality and relevance of past work)
    3. Problem Solving (ability to tackle complex problems)
    4. Communication (clarity of expression and explanation)
    5. Cultural Fit (alignment with team values and work style)
    6. Overall Potential (general suitability for roles)

    For each category, also provide a brief explanation of your score (1-2 sentences).
    
    Respond with a JSON object in this format:
    {
      "scores": {
        "technical_skills": { "score": number, "notes": "explanation" },
        "experience": { "score": number, "notes": "explanation" },
        "problem_solving": { "score": number, "notes": "explanation" },
        "communication": { "score": number, "notes": "explanation" },
        "cultural_fit": { "score": number, "notes": "explanation" },
        "overall_potential": { "score": number, "notes": "explanation" }
      },
      "summary": "Brief overall assessment in 2-3 sentences"
    }
    `;

    const promptTemplate = new PromptTemplate({
      template,
      inputVariables: [],
    });

    const chain = new LLMChain({
      llm: model,
      prompt: promptTemplate,
    });

    const response = await chain.call({});
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response.text);
    } catch (error) {
      console.error('Error parsing AI scoring response:', error);
      return NextResponse.json(
        { error: 'Failed to parse AI scoring response' },
        { status: 500 }
      );
    }

    // Save scores to database
    const scoresToInsert = Object.entries(parsedResponse.scores).map(([category, data]) => ({
      candidate_id: candidateId,
      category: category,
      score: data.score,
      notes: data.notes,
      created_by: 'ai'
    }));

    const { error: insertError } = await supabase
      .from('scores')
      .insert(scoresToInsert);

    if (insertError) {
      console.error('Error inserting scores:', insertError);
      return NextResponse.json(
        { error: `Failed to save scores: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Save summary to chat session
    await supabase
      .from('chat_sessions')
      .update({ summary: parsedResponse.summary })
      .eq('id', sessionId);

    return NextResponse.json({
      success: true,
      scores: parsedResponse.scores,
      summary: parsedResponse.summary
    });
  } catch (error) {
    console.error('Scoring API error:', error);
    return NextResponse.json(
      { error: `Failed to generate scores: ${error.message}` },
      { status: 500 }
    );
  }
}