// src/components/CandidateChat.js
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function CandidateChat({ candidateId, resumeData }) {
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'ai',
      content: "Hi there! I'd like to learn more about your experience and skills to help match you with the right opportunities. Let's start with a few questions based on your resume. Feel free to elaborate on your answers!",
      sentAt: new Date().toISOString()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // Create chat session when component mounts
  // src/components/CandidateChat.js - Update the useEffect for session creation

useEffect(() => {
  async function createChatSession() {
    try {
      console.log('Creating chat session for candidate:', candidateId);
      
      // Check if chat_sessions table exists and is accessible
      const { count, error: checkError } = await supabase
        .from('chat_sessions')
        .select('id', { count: 'exact', head: true });
        
      if (checkError) {
        console.error('Error checking chat_sessions table:', checkError);
      } else {
        console.log('chat_sessions table accessible, records count:', count);
      }
      
      // Create a new chat session
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({ candidate_id: candidateId })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating chat session:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return;
      }

      console.log('Chat session created successfully:', data.id);
      setSessionId(data.id);

      // Save initial message to database
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: data.id,
          sender: 'ai',
          content: messages[0].content
        });
        
      if (messageError) {
        console.error('Error saving initial message:', messageError);
      } else {
        console.log('Initial message saved successfully');
      }
    } catch (err) {
      console.error('Unexpected error in createChatSession:', err);
    }
  }

  if (candidateId) {
    createChatSession();
  }
}, [candidateId, messages]);

  // Auto-scroll to the most recent message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading || !sessionId) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'candidate',
      content: newMessage,
      sentAt: new Date().toISOString()
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setNewMessage('');
    setIsLoading(true);

    try {
      // Save user message to database
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        sender: 'candidate',
        content: userMessage.content
      });

      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          candidateId,
          message: userMessage.content,
          resumeData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      const aiMessage = {
        id: Date.now().toString(),
        sender: 'ai',
        content: data.message,
        sentAt: new Date().toISOString()
      };

      setMessages((prevMessages) => [...prevMessages, aiMessage]);

      // Save AI response to database
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        sender: 'ai',
        content: aiMessage.content
      });

      // If the conversation has reached a certain point, update the scores
      if (data.updateScores) {
        await fetch('/api/scoring', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            candidateId,
            sessionId
          }),
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto border rounded-lg overflow-hidden">
      <div className="bg-blue-600 text-white p-4">
        <h2 className="text-xl font-semibold">Interview Chat</h2>
        <p className="text-sm text-blue-100">
          Chat with our AI to help us understand your experience better
        </p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 flex ${
              message.sender === 'candidate' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`p-3 rounded-lg max-w-[80%] ${
                message.sender === 'candidate'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-white border rounded-bl-none'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <span className="text-xs mt-1 block opacity-70">
                {new Date(message.sentAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`bg-blue-600 text-white p-2 rounded-r-lg ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}