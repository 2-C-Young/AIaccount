import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare, ArrowRight, RefreshCw, Flame, Heart, TrendingUp, Crown } from 'lucide-react';
import { api } from '../api';

const SUGGESTIONS = [
  "내 소비 습관의 가장 큰 문제점은?",
  "식비를 효과적으로 줄일 수 있는 대책은?",
  "내가 아낀 돈을 예금에 넣으면 얼마나 모여?",
  "이번 리포트에 나온 Worst 소비에 대해 피드백해줘"
];

// Helper component to render simple markdown styles
function SimpleMarkdown({ text }) {
  if (!text) return null;

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
          parts.push(<strong key={startIdx} className="text-blue-900 font-extrabold">{remaining.substring(startIdx + 2, endIdx)}</strong>);
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

export default function AiCoachView({ messages, onSendMessage, isLoading, user, setUser }) {
  const [persona, setPersona] = useState(user?.coachPersona || 'SPICY');
  const [reportLoading, setReportLoading] = useState(false);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  // Sync persona with user object if it changes in user profile
  useEffect(() => {
    if (user?.coachPersona) {
      setPersona(user.coachPersona);
    }
  }, [user?.coachPersona]);

  const handlePersonaChange = async (selectedPersona) => {
    setPersona(selectedPersona);
    // Optimistically update or just change state. 
    // In our design, the user can change persona dynamically, 
    // and if they request a new report, it will be saved.
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const reportRes = await api.getAiReport(persona);
      // Fetch updated user data to refresh app state
      const updatedUser = await api.getUser();
      setUser(updatedUser);
    } catch (e) {
      console.error('Failed to generate report', e);
      alert('소비 리포트를 생성하는 데 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setReportLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim(), persona, user?.lastAiReport);
    setInput('');
  };

  const handleSuggestionClick = (suggestion) => {
    if (isLoading) return;
    onSendMessage(suggestion, persona, user?.lastAiReport);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const getPersonaIcon = (p) => {
    switch (p) {
      case 'SPICY': return <Flame className="w-5 h-5 text-rose-500 fill-rose-100" />;
      case 'SWEET': return <Crown className="w-5 h-5 text-amber-500 fill-amber-100" />;
      case 'INVESTOR': return <TrendingUp className="w-5 h-5 text-indigo-500" />;
      default: return <Sparkles className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPersonaName = (p) => {
    switch (p) {
      case 'SPICY': return '매운맛 코치 👹';
      case 'SWEET': return '우아한 프리미엄 코치 👑';
      case 'INVESTOR': return '자산가 버핏 코치 💼';
      default: return 'AI 코치';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner - Persona Selection */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-800">소비 코치 성향 설정</h2>
          <p className="text-xs text-slate-400 mt-0.5">원하는 AI 코치의 피드백 스타일을 골라보세요. 즉시 말투가 바뀝니다.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto self-start md:self-auto">
          {[
            { value: 'SPICY', label: '👹 매운맛', activeClass: 'bg-white text-rose-600 shadow-sm border border-rose-100/50' },
            { value: 'SWEET', label: '👑 우아함', activeClass: 'bg-white text-amber-600 shadow-sm border border-amber-100/50' },
            { value: 'INVESTOR', label: '💼 자산가', activeClass: 'bg-white text-indigo-600 shadow-sm border border-indigo-100/50' }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => handlePersonaChange(item.value)}
              className={`flex-1 md:flex-initial py-2 px-4 text-xs font-bold rounded-lg transition-all ${
                persona === item.value
                  ? item.activeClass
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Top: Monthly Report View */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">이번 달 AI 소비 분석 리포트</h3>
                  {user?.lastAiReportPersona && (
                    <span className="text-[10px] font-bold text-slate-400">
                      최근 분석 성격: {getPersonaName(user.lastAiReportPersona)}
                    </span>
                  )}
                </div>
              </div>

              {user?.lastAiReport && (
                <button
                  onClick={handleGenerateReport}
                  disabled={reportLoading}
                  className="flex items-center gap-1 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-all border border-blue-100/50 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${reportLoading ? 'animate-spin' : ''}`} />
                  새로 분석하기
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {reportLoading ? (
                <div className="h-full flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">소비 데이터를 분석하는 중...</h4>
                    <p className="text-xs text-slate-400 mt-1">사용자의 소비 만족도와 쏠림 데이터를 기반으로<br />코치가 맞춤 조언을 작성하고 있습니다.</p>
                  </div>
                </div>
              ) : user?.lastAiReport ? (
                <div className="space-y-4">
                  {user.lastAiReportPersona !== persona && (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 font-semibold flex items-center justify-between gap-2 shrink-0">
                      <span>코치 성향을 바꾸셨네요! 새로운 스타일의 리포트를 받으시겠어요?</span>
                      <button
                        onClick={handleGenerateReport}
                        className="py-1 px-2.5 bg-amber-600 text-white rounded-lg text-[10px] font-black shrink-0 hover:bg-amber-700 transition-all shadow-sm"
                      >
                        지금 분석
                      </button>
                    </div>
                  )}
                  <SimpleMarkdown text={user.lastAiReport} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-16 text-center space-y-6 max-w-sm mx-auto">
                  <div className="p-4 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">리포트가 아직 생성되지 않았습니다</h4>
                    <p className="text-xs text-slate-400 mt-1">이번 달의 수입/지출 내역과 스스로 체크한 만족도를 종합하여 AI 소비 코치의 특화 진단을 시작해 보세요.</p>
                  </div>
                  <button
                    onClick={handleGenerateReport}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md shadow-blue-200 transition-all text-xs flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    이번 달 소비 분석 리포트 생성
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right/Bottom: Follow-up Chat Room */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[600px] overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white rounded-lg border border-slate-100 shadow-sm shrink-0">
                  {getPersonaIcon(persona)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{getPersonaName(persona)}와 대화</h4>
                  <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    후속 꼬리 질문 가능
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-700">코치에게 꼬리 질문하기</h5>
                    <p className="text-[10px] text-slate-400 mt-1">리포트에서 이해하기 힘든 지적이나 더 구체적인 조언이 필요하다면 코치에게 바로 질문해 보세요.</p>
                  </div>
                  
                  {/* Suggestions */}
                  <div className="w-full space-y-1.5 pt-2">
                    {SUGGESTIONS.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(s)}
                        className="w-full p-2.5 text-left bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-100 text-[10px] text-slate-700 hover:text-blue-800 font-semibold rounded-lg transition-all flex items-center justify-between group"
                      >
                        <span className="truncate">{s}</span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all text-blue-600 shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((m, idx) => {
                    const isUser = m.role === 'user';
                    return (
                      <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] p-3.5 rounded-2xl shadow-sm text-xs ${isUser
                            ? 'bg-blue-600 text-white rounded-br-none font-bold'
                            : 'bg-slate-50 border border-slate-100 rounded-bl-none font-medium'
                          }`}>
                          {isUser ? (
                            <p>{m.content}</p>
                          ) : (
                            <SimpleMarkdown text={m.content} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl rounded-bl-none flex items-center gap-1.5 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Suggestions list during active chat */}
            {messages.length > 0 && !isLoading && (
              <div className="px-4 py-1.5 flex gap-1.5 overflow-x-auto border-t border-slate-50 bg-slate-50/20 shrink-0">
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(s)}
                    className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-100 hover:border-blue-100 text-slate-500 hover:text-blue-800 text-[10px] font-bold rounded-full whitespace-nowrap transition-all shadow-sm shrink-0"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input form */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-slate-100 flex gap-1.5 bg-slate-50/30 shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="코치에게 꼬리 질문을 해보세요..."
                className="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-xs font-semibold"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all shrink-0 flex items-center justify-center disabled:opacity-50"
                disabled={isLoading || !input.trim()}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
