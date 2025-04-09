// src/lib/resume-parser.js
import pdfParse from 'pdf-parse';
import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';
import { LLMChain } from 'langchain/chains';

const model = new OpenAI({
  temperature: 0,
  modelName: 'gpt-4',
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Function to extract text from PDF
async function extractTextFromPDF(fileBuffer) {
  try {
    const pdfData = await pdfParse(fileBuffer);
    return pdfData.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// Function to extract information using AI
async function extractInformationWithAI(text) {
  const template = `
  You are an expert resume parser. Extract the following information from the resume text:
  
  Resume Text:
  {resumeText}
  
  Extract the following information in JSON format:
  1. Contact Information (name, email, phone, location)
  2. Skills (as an array of string skills)
  3. Education (as an array of objects with school, degree, field, years)
  4. Work Experience (as an array of objects with company, title, dates, description)
  
  Format your response as a valid JSON object with these keys: contactInfo, skills, education, experience.
  `;

  const promptTemplate = new PromptTemplate({
    template,
    inputVariables: ['resumeText'],
  });

  const chain = new LLMChain({
    llm: model,
    prompt: promptTemplate,
  });

  const response = await chain.call({ resumeText: text });
  
  try {
    return JSON.parse(response.text);
  } catch (error) {
    console.error('Error parsing AI response:', error);
    throw new Error('Failed to parse AI response');
  }
}

// Function to generate embeddings for resume text
async function generateEmbeddings(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-ada-002'
    })
  });

  const data = await response.json();
  return data.data[0].embedding;
}

// Main parse function
export async function parseResume(fileBuffer) {
  // Extract text from PDF
  const text = await extractTextFromPDF(fileBuffer);
  
  // Extract information using AI
  const { contactInfo, skills, education, experience } = await extractInformationWithAI(text);
  
  // Generate embeddings for the text
  const vector = await generateEmbeddings(text);
  
  return {
    text,
    contactInfo,
    skills,
    education,
    experience,
    vector
  };
}