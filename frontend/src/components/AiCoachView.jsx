import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare, ArrowRight } from 'lucide-react';

const SUGGESTIONS = [
  "이번 달 소비 분석해줘",
  "여행 가도 될까?",
  "배달 줄이면 얼마나 절약돼?",
  "다음 달 예산 추천해줘"
];

// Helper component to render simple markdown styles
function SimpleMarkdown({ text }) {
  if (!text) return null;

  // Split into lines
  const lines = text.split('\n');

  return (
    <div className="space-y-2 text-sm text-slate-700 leading-relaxed font-medium">
      {lines.map((line, idx) => {
        let content = line;

        // Match headers
        if (content.startsWith('### ')) {
          return <h4 key={idx} className="text-sm font-bold text-slate-800 pt-2">{content.replace('### ', '')}</h4>;
        }
        if (content.startsWith('## ')) {
          return <h3 key={idx} className="text-base font-bold text-slate-800 pt-3 border-b border-slate-100 pb-1">{content.replace('## ', '')}</h3>;
        }
        if (content.startsWith('# ')) {
          return <h2 key={idx} className="text-lg font-bold text-blue-800 pt-4">{content.replace('# ', '')}</h2>;
        }

        // Match lists
        const isBullet = content.startsWith('- ') || content.startsWith('* ');
        if (isBullet) {
          content = content.substring(2);
        }

        // Parse bold markers **text**
        const parts = [];
        let remaining = content;
        while (remaining.includes('**')) {
          const startIdx = remaining.indexOf('**');
          const endIdx = remaining.indexOf('**', startIdx + 2);
          if (endIdx === -1) break;

          parts.push(remaining.substring(0, startIdx));
          parts.push(<strong key={startIdx} className="text-blue-900 font-bold">{remaining.substring(startIdx + 2, endIdx)}</strong>);
          remaining = remaining.substring(endIdx + 2);
        }
        parts.push(remaining);

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-4 py-0.5">
              <span className="text-blue-500 font-bold">•</span>
              <div>{parts}</div>
            </div>
          );
        }

        return <p key={idx} className={content.trim() === '' ? 'h-2' : ''}>{parts}</p>;
      })}
    </div>
  );
}

export default function AiCoachView({ messages, onSendMessage, isLoading }) {
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleSuggestionClick = (suggestion) => {
    if (isLoading) return;
    onSendMessage(suggestion);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[calc(100vh-220px)] min-h-[500px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">AI 소비 코치</h2>
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Gemini Flash 활성화됨
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 mb-1">AI 소비 코칭 서비스</h3>
              <p className="text-xs text-slate-500">
                가계부 데이터를 바탕으로 AI 코치와 대화하며 현명한 소비 습관을 설계해 보세요.
              </p>
            </div>

            {/* Suggestions list */}
            <div className="w-full space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left pl-1">추천 질문</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(s)}
                    className="p-3 text-left bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-100 text-xs text-slate-700 hover:text-blue-800 font-semibold rounded-xl transition-all flex items-center justify-between group"
                  >
                    <span>{s}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all text-blue-600 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${isUser
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-50 border border-slate-100 rounded-bl-none'
                    }`}>
                    {isUser ? (
                      <p className="text-sm font-semibold">{m.content}</p>
                    ) : (
                      <SimpleMarkdown text={m.content} />
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] p-4 bg-slate-50 border border-slate-100 rounded-2xl rounded-bl-none flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Suggestion overlay during active conversation (small chips) */}
      {messages.length > 0 && !isLoading && (
        <div className="px-5 py-2 flex gap-2 overflow-x-auto border-t border-slate-50 bg-slate-50/20">
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(s)}
              className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-100 hover:border-blue-100 text-slate-600 hover:text-blue-800 text-xs font-semibold rounded-full whitespace-nowrap transition-all shadow-sm shrink-0"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input box */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100 flex gap-2 bg-slate-50/30">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="소비 코치에게 물어볼 내용을 입력하세요..."
          className="flex-1 px-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-200 transition-all shrink-0 flex items-center justify-center disabled:opacity-50"
          disabled={isLoading || !input.trim()}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
