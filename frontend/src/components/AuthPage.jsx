import React, { useState } from 'react';
import { api } from '../api';
import { Sparkles, Lock, User as UserIcon, DollarSign, Target } from 'lucide-react';

export default function AuthPage({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  
  // Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [income, setIncome] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Login flow
        const user = await api.login({ username, password });
        onAuthSuccess(user);
      } else {
        // Signup flow
        if (!income) {
          setError('월 소득을 입력해 주세요.');
          setLoading(false);
          return;
        }

        const user = await api.signup({
          username,
          password,
          income: Number(income)
        });
        
        // Auto-login after signup
        const loggedInUser = await api.login({ username, password });
        onAuthSuccess(loggedInUser);
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setError(err.response.data);
      } else {
        setError(isLogin ? '로그인에 실패했습니다. 아이디와 비밀번호를 확인해 주세요.' : '회원가입에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
        
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">AI Spending Coach</h1>
            <p className="text-xs text-slate-400 font-medium">현명한 자산 설계를 도와주는 인공지능 소비 코치</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
              isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            로그인
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
              !isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            회원가입
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 pl-0.5">아이디</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="아이디를 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 pl-0.5">비밀번호</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
                required
              />
            </div>
          </div>

          {/* Conditional Signup Fields */}
          {!isLogin && (
            <div className="space-y-4 border-t border-slate-100 pt-4 mt-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 pl-0.5">월 고정 소득 (원)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    placeholder="예: 3000000"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
                    required
                  />
                </div>
              </div>

            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 font-semibold pl-0.5">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입 및 시작하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
