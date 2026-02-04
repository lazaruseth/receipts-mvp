'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Agreement, ChatMessage } from '@/types';

function ChatContent() {
  const searchParams = useSearchParams();
  const initialAgreementId = searchParams.get('agreementId');

  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [selectedAgreement, setSelectedAgreement] = useState<string>(initialAgreementId || '');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/agreements')
      .then((res) => res.json())
      .then((data) => {
        setAgreements(data.agreements);
        if (!selectedAgreement && data.agreements.length > 0) {
          setSelectedAgreement(initialAgreementId || data.agreements[0].id);
        }
      });
  }, [initialAgreementId, selectedAgreement]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedAgreementData = agreements.find((a) => a.id === selectedAgreement);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedAgreement || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          agreementId: selectedAgreement,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || data.error || 'Failed to get response',
        timestamp: new Date(),
        citations: data.citations,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, there was an error processing your request.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    'Can I get a refund?',
    'What happens if I need to cancel?',
    'Am I giving up my right to sue?',
    'Is there auto-renewal?',
    'Who is my data shared with?',
  ];

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ask AI</h1>
        <p className="text-gray-600">Get instant answers about your agreements</p>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Sidebar - Agreement Selector */}
        <div className="w-80 flex-shrink-0">
          <div className="card h-full overflow-auto">
            <h2 className="font-semibold text-gray-900 mb-4">Select Agreement</h2>
            <div className="space-y-2">
              {agreements.map((agreement) => (
                <button
                  key={agreement.id}
                  onClick={() => {
                    setSelectedAgreement(agreement.id);
                    setMessages([]);
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedAgreement === agreement.id
                      ? 'bg-primary-50 border-2 border-primary-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <p className="font-medium text-gray-900">{agreement.merchantName}</p>
                  <p className="text-sm text-gray-500">{agreement.merchantCategory}</p>
                  {agreement.riskFlags.length > 0 && (
                    <p className="text-xs text-warning-600 mt-1">
                      {agreement.riskFlags.length} risk flag{agreement.riskFlags.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="card flex-1 flex flex-col min-h-0">
            {/* Selected Agreement Info */}
            {selectedAgreementData && (
              <div className="p-4 bg-gray-50 rounded-lg mb-4 flex-shrink-0">
                <p className="text-sm text-gray-500">Asking about:</p>
                <p className="font-semibold text-gray-900">{selectedAgreementData.merchantName}</p>
                <p className="text-sm text-gray-600">{selectedAgreementData.documentTitle}</p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-auto mb-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <svg
                    className="w-16 h-16 text-gray-300 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ask me anything about this agreement</h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    I can explain refund policies, cancellation terms, dispute procedures, and flag any concerning
                    clauses.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    {suggestedQuestions.map((question) => (
                      <button
                        key={question}
                        onClick={() => setInput(question)}
                        className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.citations && message.citations.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500">Sources: {message.citations.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-3 flex-shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about this agreement..."
                className="input flex-1"
                disabled={loading || !selectedAgreement}
              />
              <button
                type="submit"
                disabled={loading || !input.trim() || !selectedAgreement}
                className="btn-primary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}
