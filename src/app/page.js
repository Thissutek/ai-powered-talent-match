// src/app/page.js
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-700">TalentMatchAI</div>
          <div className="space-x-4">
            <Link href="/auth/login" className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 transition">
              Login
            </Link>
            <Link href="/auth/signup" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            AI-Powered Talent Matching
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            Revolutionize your recruitment process with AI-driven candidate assessments, intelligent matching, and human expertise combined.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="px-6 py-3 rounded-lg bg-blue-600 text-white text-lg font-medium hover:bg-blue-700 transition">
              Get Started
            </Link>
            <Link href="#how-it-works" className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 text-lg font-medium hover:bg-gray-50 transition">
              Learn More
            </Link>
          </div>
        </div>

        <div id="how-it-works" className="mt-24 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mb-4">1</div>
              <h3 className="text-xl font-semibold mb-3">AI Resume Analysis</h3>
              <p className="text-gray-600">Our AI analyzes resumes to extract skills, experience, and potential matches for your open positions.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mb-4">2</div>
              <h3 className="text-xl font-semibold mb-3">Interactive AI Interviews</h3>
              <p className="text-gray-600">Candidates chat with our AI to assess technical skills, communication, and problem-solving abilities.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mb-4">3</div>
              <h3 className="text-xl font-semibold mb-3">Human Expert Input</h3>
              <p className="text-gray-600">Combine AI scoring with human recruiter expertise for the perfect balance of efficiency and insight.</p>
            </div>
          </div>
        </div>
        
        <div className="mt-24 max-w-5xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to transform your recruitment process?</h2>
              <p className="text-gray-600 mb-6">Join innovative companies using TalentMatchAI to find the perfect candidates faster and more effectively.</p>
              <Link href="/auth/signup" className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition inline-block">
                Start Free Trial
              </Link>
            </div>
            <div className="md:w-1/2 bg-blue-50 p-6 rounded-lg">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>AI-powered resume parsing and analysis</span>
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Automated preliminary candidate interviews</span>
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Comprehensive scoring and ranking system</span>
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Human-in-the-loop expert reviews</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-50 border-t mt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-600 mb-4 md:mb-0">
              © 2024 TalentMatchAI. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-600 hover:text-blue-600">Terms</a>
              <a href="#" className="text-gray-600 hover:text-blue-600">Privacy</a>
              <a href="#" className="text-gray-600 hover:text-blue-600">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}