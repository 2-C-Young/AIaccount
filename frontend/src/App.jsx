import React, { useState, useEffect } from 'react';
import { api } from './api';
import DashboardView from './components/DashboardView';
import TransactionManager from './components/TransactionManager';
import AiCoachView from './components/AiCoachView';
import UserFormModal from './components/UserFormModal';
import AuthPage from './components/AuthPage';
import { LayoutDashboard, Receipt, Sparkles, Settings, LogOut } from 'lucide-react';

export default function App() {
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dashboard & Transactions
  const [dashboardData, setDashboardData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [user, setUser] = useState(null);
  
  // AI summary states - saved in sessionStorage to avoid fetching on tab switching
  const [aiSummary, setAiSummary] = useState(sessionStorage.getItem(`aiSummary_${userId}`) || '');
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // AI chat messages
  const [aiMessages, setAiMessages] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAuthSuccess = (userData) => {
    localStorage.setItem('userId', userData.id);
    setUserId(userData.id);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    setUserId(null);
    setUser(null);
    setDashboardData(null);
    setTransactions([]);
    setAiSummary('');
    setAiMessages([]);
    setActiveTab('dashboard');
  };

  // Loads AI summary in the background when requested manually
  const fetchAiSummary = async () => {
    setAiSummaryLoading(true);
    try {
      const summaryRes = await api.getDashboardSummary();
      setAiSummary(summaryRes.aiSummary);
      if (userId) {
        sessionStorage.setItem(`aiSummary_${userId}`, summaryRes.aiSummary);
      }
    } catch (e) {
      console.error('Failed to load AI summary', e);
      let errMsg = 'AI 요약을 가져오지 못했습니다.';
      if (e.response && e.response.status === 429) {
        errMsg = '⚠️ API 호출 한도가 초과되었습니다. 잠시 후 다시 시도해 주세요.';
      }
      setAiSummary(errMsg);
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const fetchInitialData = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      // Fetch stats instantly
      const dash = await api.getDashboard();
      setDashboardData(dash);
      
      const userData = await api.getUser();
      setUser(userData);

      const txs = await api.getTransactions();
      setTransactions(txs);

      // Do NOT auto-fetch AI summary on mount to conserve quota
      if (!sessionStorage.getItem(`aiSummary_${userId}`)) {
        setAiSummary('우측의 [AI 분석 받기] 버튼을 누르면 코치의 오늘의 한 줄 조언을 받아볼 수 있습니다.');
      }
    } catch (e) {
      console.error('Failed to load initial data', e);
      if (e.response && e.response.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchInitialData();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const handleUserSetup = async (userData) => {
    try {
      const updated = await api.updateUser(userData);
      setUser(updated);
      setIsUserModalOpen(false);
      
      // Reload stats instantly
      const dash = await api.getDashboard();
      setDashboardData(dash);
    } catch (e) {
      console.error('Failed to save user data', e);
      alert('사용자 정보를 저장하지 못했습니다.');
    }
  };

  const handleCreateTransaction = async (txData) => {
    try {
      await api.createTransaction(txData);
      
      // Reload stats instantly
      const txs = await api.getTransactions();
      setTransactions(txs);
      const dash = await api.getDashboard();
      setDashboardData(dash);
    } catch (e) {
      console.error('Failed to create transaction', e);
    }
  };

  const handleUpdateTransaction = async (id, txData) => {
    try {
      await api.updateTransaction(id, txData);
      
      // Reload stats instantly
      const txs = await api.getTransactions();
      setTransactions(txs);
      const dash = await api.getDashboard();
      setDashboardData(dash);
    } catch (e) {
      console.error('Failed to update transaction', e);
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await api.deleteTransaction(id);
      
      // Reload stats instantly
      const txs = await api.getTransactions();
      setTransactions(txs);
      const dash = await api.getDashboard();
      setDashboardData(dash);
    } catch (e) {
      console.error('Failed to delete transaction', e);
    }
  };

  const handleSendAiMessage = async (content) => {
    setAiMessages((prev) => [...prev, { role: 'user', content }]);
    setIsAiLoading(true);
    try {
      const response = await api.askAi(content);
      setAiMessages((prev) => [...prev, { role: 'assistant', content: response.answer }]);
    } catch (e) {
      setAiMessages((prev) => [...prev, { role: 'assistant', content: '죄송합니다. 답변을 받아오는 데 실패했습니다. 잠시 후 다시 시도해 주세요.' }]);
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // Auth Guard
  if (!userId) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-100 flex flex-col justify-between shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-lg">W</div>
            <span className="font-extrabold text-slate-800 tracking-tight text-lg">AI Spending Coach</span>
          </div>
          
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              대시보드
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'transactions'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Receipt className="w-4 h-4" />
              가계부 내역
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'ai'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              AI 소비 코치
            </button>
          </nav>
        </div>

        {user && (
          <div className="p-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="truncate pr-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">나의 자산 목표</p>
                <p className="text-xs font-bold text-slate-800 truncate">
                  목표: {new Intl.NumberFormat('ko-KR').format(user.goalSaving)}원
                </p>
              </div>
              <button
                onClick={() => setIsUserModalOpen(true)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-all shrink-0"
                title="설정 변경"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-xl text-xs font-bold transition-all border border-slate-100"
            >
              <LogOut className="w-3.5 h-3.5" />
              로그아웃
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && (
          <DashboardView 
            data={dashboardData} 
            aiSummary={aiSummary}
            aiSummaryLoading={aiSummaryLoading}
            onFetchSummary={fetchAiSummary}
            onEditProfile={() => setIsUserModalOpen(true)} 
          />
        )}
        {activeTab === 'transactions' && (
          <TransactionManager
            transactions={transactions}
            onCreate={handleCreateTransaction}
            onUpdate={handleUpdateTransaction}
            onDelete={handleDeleteTransaction}
          />
        )}
        {activeTab === 'ai' && (
          <AiCoachView
            messages={aiMessages}
            onSendMessage={handleSendAiMessage}
            isLoading={isAiLoading}
          />
        )}
      </main>

      {/* Profile Edit Modal */}
      <UserFormModal
        isOpen={isUserModalOpen}
        onSubmit={handleUserSetup}
        initialData={user}
      />
    </div>
  );
}
