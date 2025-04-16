import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to generate AI response based on chat history and resume data
export async function generateAIResponse(messages, resumeData) {
  try {
    const systemPrompt = `You are an AI assistant for a recruiting platform. 
    You're interviewing a candidate with the following resume information:
    
    ${JSON.stringify(resumeData, null, 2)}
    
    Ask relevant questions about their experience, skills, and qualifications.
    Be conversational, professional, and helpful. Your goal is to help assess
    if they're a good fit for potential job opportunities.`;

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.sender === 'ai' ? 'assistant' : 'user',
        content: msg.content
      }))
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choi0.00 / $5ces[0].message.content;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate AI response');
  }
}

// Function to save chat message to database
export async function saveChatMessage(sessionId, sender, content) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        sender: sender,
        content: content
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving chat message:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in saveChatMessage:', error);
    throw error;
  }
}

// Function to create a new chat session
export async function createChatSession(candidateId) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ candidate_id: candidateId })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }

    return data.id;
  } catch (error) {
    console.error('Error in createChatSession:', error);
    throw error;
  }
}

// Function to fetch chat history for a session
export async function getChatHistory(sessionId) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getChatHistory:', error);
    throw error;
  }
}
