import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Pin, ArrowUpRight, ArrowDownRight, Calendar as CalendarIcon, List as ListIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const CATEGORY_LABELS = {
  FOOD: '식비',
  SHOPPING: '쇼핑/생필품',
  HOUSING: '주거/통신',
  TRANSPORTATION: '교통',
  MEDICAL: '의료/건강',
  EDUCATION: '교육/학습',
  LEISURE: '문화/여가',
  ETC: '기타'
};

const CATEGORY_STYLES = {
  FOOD: 'bg-orange-50 text-orange-700 border-orange-200',
  SHOPPING: 'bg-pink-50 text-pink-700 border-pink-200',
  HOUSING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  TRANSPORTATION: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  MEDICAL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  EDUCATION: 'bg-purple-50 text-purple-700 border-purple-200',
  LEISURE: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  ETC: 'bg-slate-50 text-slate-700 border-slate-200'
};

const ROW_BG_STYLES = {
  FOOD: 'bg-orange-100/30 hover:bg-orange-100/50',
  SHOPPING: 'bg-pink-100/30 hover:bg-pink-100/50',
  HOUSING: 'bg-indigo-100/30 hover:bg-indigo-100/50',
  TRANSPORTATION: 'bg-cyan-100/30 hover:bg-cyan-100/50',
  MEDICAL: 'bg-emerald-100/30 hover:bg-emerald-100/50',
  EDUCATION: 'bg-purple-100/30 hover:bg-purple-100/50',
  LEISURE: 'bg-yellow-100/30 hover:bg-yellow-100/50',
  ETC: 'bg-slate-100/30 hover:bg-slate-100/50'
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function TransactionManager({ transactions, onCreate, onUpdate, onDelete }) {
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' or 'CALENDAR'
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split('T')[0]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form fields
  const [type, setType] = useState('SPENDING');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('FOOD');
  const [memo, setMemo] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isFixed, setIsFixed] = useState(false);
  const [satisfaction, setSatisfaction] = useState('NORMAL');

  const openAddModal = (defaultDate) => {
    setEditingId(null);
    setType('SPENDING');
    setAmount('');
    setCategory('FOOD');
    setMemo('');
    setTransactionDate(defaultDate || new Date().toISOString().split('T')[0]);
    setIsFixed(false);
    setSatisfaction('NORMAL');
    setIsModalOpen(true);
  };

  const openEditModal = (t) => {
    setEditingId(t.id);
    setType(t.type);
    setAmount(t.amount.toString());
    setCategory(t.category);
    setMemo(t.memo?.replace(' (매월 고정)', '') || '');
    setTransactionDate(t.transactionDate);
    setIsFixed(!!t.isFixed);
    setSatisfaction(t.satisfaction || 'NORMAL');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert('올바른 금액을 입력해 주세요.');
      return;
    }

    const payload = {
      type,
      amount: Number(amount),
      category: type === 'INCOME' ? 'ETC' : category,
      memo,
      transactionDate,
      isFixed,
      satisfaction: type === 'INCOME' ? 'NORMAL' : satisfaction,
    };

    if (editingId) {
      onUpdate(editingId, payload);
    } else {
      onCreate(payload);
    }
    setIsModalOpen(false);
  };

  const formatKrw = (val) => {
    return new Intl.NumberFormat('ko-KR').format(val || 0) + '원';
  };

  // Convert amount to compact Korean abbreviation (e.g. +5만, -1.2만, -8천)
  const formatCompactKrw = (amount, prefix) => {
    if (!amount) return '';
    if (amount >= 10000) {
      const val = amount / 10000;
      return `${prefix}${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}만`;
    }
    if (amount >= 1000) {
      const val = amount / 1000;
      return `${prefix}${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}천`;
    }
    return `${prefix}${amount}`;
  };

  // Month navigation in calendar mode
  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  // Group transactions for List View (by month)
  const groupedTransactions = transactions.reduce((groups, t) => {
    if (!t.transactionDate) return groups;
    const parts = t.transactionDate.split('-');
    const monthKey = `${parts[0]}년 ${parts[1]}월`;
    
    if (!groups[monthKey]) {
      groups[monthKey] = {
        txs: [],
        incomeSum: 0,
        spendingSum: 0
      };
    }
    
    groups[monthKey].txs.push(t);
    if (t.type === 'INCOME') {
      groups[monthKey].incomeSum += t.amount;
    } else {
      groups[monthKey].spendingSum += t.amount;
    }
    
    return groups;
  }, {});

  const sortedMonths = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

  // Calendar details calculations
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create array of days for calendar grid
  const calendarCells = [];
  // Empty padding cells before the 1st
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  // Filter transactions for specific date
  const getTransactionsForDate = (dateStr) => {
    return transactions.filter(t => t.transactionDate === dateStr);
  };

  // Compute total income and spending for specific date
  const getDailyTotals = (dateStr) => {
    const dayTxs = getTransactionsForDate(dateStr);
    let income = 0;
    let spending = 0;
    dayTxs.forEach(t => {
      if (t.type === 'INCOME') {
        income += t.amount;
      } else {
        spending += t.amount;
      }
    });
    return { income, spending };
  };

  // Selected date transactions (details panel below calendar)
  const selectedDateTxs = getTransactionsForDate(selectedDateStr);
  const selectedDateTotals = getDailyTotals(selectedDateStr);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">가계부 내역 관리</h2>
          <p className="text-xs text-slate-400 mt-0.5">리스트 뷰와 달력 뷰를 자유롭게 오가며 지출 흐름을 관리해 보세요.</p>
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* View switcher toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('LIST')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'LIST'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              리스트형
            </button>
            <button
              onClick={() => setViewMode('CALENDAR')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'CALENDAR'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              달력형
            </button>
          </div>

          <button
            onClick={() => openAddModal(selectedDateStr)}
            className="flex items-center gap-1.5 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm hover:shadow transition-all text-xs"
          >
            <Plus className="w-4 h-4" />
            내역 추가
          </button>
        </div>
      </div>

      {/* RENDER LIST VIEW MODE */}
      {viewMode === 'LIST' && (
        sortedMonths.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-sm">
            등록된 수입 및 지출 내역이 없습니다.<br />우측 상단의 '내역 추가' 버튼으로 첫 거래를 등록해 보세요.
          </div>
        ) : (
          <div className="space-y-8">
            {sortedMonths.map((monthKey) => {
              const { txs, incomeSum, spendingSum } = groupedTransactions[monthKey];
              return (
                <div key={monthKey} className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                    <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-blue-600 rounded" />
                      {monthKey}
                    </h3>
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <span className="flex items-center text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-md">
                        <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 shrink-0" />
                        수입: {formatKrw(incomeSum)}
                      </span>
                      <span className="flex items-center text-rose-600 bg-rose-50/50 px-2 py-0.5 rounded-md">
                        <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 shrink-0" />
                        지출: {formatKrw(spendingSum)}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          <th className="pb-3 pl-2">날짜</th>
                          <th className="pb-3">유형</th>
                          <th className="pb-3">카테고리</th>
                          <th className="pb-3">메모</th>
                          <th className="pb-3 text-center">만족도</th>
                          <th className="pb-3 text-right">금액</th>
                          <th className="pb-3 text-center">동작</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-sm">
                        {txs.map((t) => {
                          const isIncome = t.type === 'INCOME';
                          const rowBgClass = isIncome ? 'bg-blue-100/30 hover:bg-blue-100/50' : ROW_BG_STYLES[t.category] || 'bg-white';
                          return (
                            <tr key={`${t.id}_${t.transactionDate}`} className={`transition-colors ${rowBgClass}`}>
                              <td className="py-3 pl-2 text-slate-500 font-medium">{t.transactionDate}</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  isIncome ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                                }`}>
                                  {isIncome ? '수입' : '지출'}
                                </span>
                              </td>
                              <td className="py-3 text-slate-700">
                                <div className="flex items-center gap-1.5">
                                  {isIncome ? (
                                    <span className="px-2 py-0.5 rounded-md border border-slate-100 bg-slate-50 text-slate-400 text-xs font-bold">수입</span>
                                  ) : (
                                    <span className={`px-2 py-0.5 rounded-md border text-xs font-bold ${CATEGORY_STYLES[t.category]}`}>
                                      {CATEGORY_LABELS[t.category]}
                                    </span>
                                  )}
                                  {t.isFixed && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-extrabold rounded-md border border-blue-100">
                                      <Pin className="w-2.5 h-2.5 fill-blue-600" />
                                      고정
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 text-slate-700 max-w-[200px] truncate">{t.memo || '-'}</td>
                              <td className="py-3 text-center text-xs font-semibold text-slate-500">
                                {isIncome ? '-' : (
                                  t.satisfaction === 'SATISFIED' ? '🥰 만족' :
                                  t.satisfaction === 'REGRET' ? '💸 후회' : '😐 평범'
                                )}
                              </td>
                              <td className={`py-3 text-right font-bold ${
                                isIncome ? 'text-blue-600' : 'text-slate-800'
                              }`}>
                                {isIncome ? '+' : '-'}{formatKrw(t.amount)}
                              </td>
                              <td className="py-3 text-center">
                                <div className="inline-flex gap-2">
                                  <button
                                    onClick={() => openEditModal(t)}
                                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded transition-all"
                                    title="수정"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm('정말 삭제하시겠습니까? (고정 지출은 전체 기간에서 함께 삭제됩니다)')) {
                                        onDelete(t.id);
                                      }
                                    }}
                                    className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded transition-all"
                                    title="삭제"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* RENDER CALENDAR VIEW MODE */}
      {viewMode === 'CALENDAR' && (
        <div className="space-y-6">
          {/* Calendar Month Navigation Header */}
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-100 text-slate-600 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-extrabold text-slate-800 text-base">
              {calendarDate.getFullYear()}년 {String(calendarDate.getMonth() + 1).padStart(2, '0')}월
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-100 text-slate-600 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid Container */}
          <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
            {/* Weekdays row */}
            <div className="grid grid-cols-7 bg-slate-50/50 text-center py-2.5 border-b border-slate-100 text-xs font-bold text-slate-400">
              {WEEKDAYS.map((day, idx) => (
                <span 
                  key={idx} 
                  className={idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : ''}
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-white">
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="bg-slate-50/30 min-h-[75px] sm:min-h-[90px]" />;
                }

                const dayStr = String(day).padStart(2, '0');
                const monthStr = String(calendarDate.getMonth() + 1).padStart(2, '0');
                const dateKey = `${year}-${monthStr}-${dayStr}`;
                const isSelected = selectedDateStr === dateKey;
                
                const { income, spending } = getDailyTotals(dateKey);
                const hasData = income > 0 || spending > 0;

                // Mark current day in system
                const isToday = new Date().toISOString().split('T')[0] === dateKey;

                return (
                  <div
                    key={`day-${day}`}
                    onClick={() => setSelectedDateStr(dateKey)}
                    className={`p-1.5 min-h-[75px] sm:min-h-[90px] flex flex-col justify-between cursor-pointer transition-all hover:bg-blue-50/30 ${
                      isSelected ? 'bg-blue-50/60 ring-2 ring-blue-600/20 ring-inset' : ''
                    }`}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${
                        isToday 
                          ? 'w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center'
                          : idx % 7 === 0 
                            ? 'text-red-500' 
                            : idx % 7 === 6 
                              ? 'text-blue-500' 
                              : 'text-slate-700'
                      }`}>
                        {day}
                      </span>
                    </div>

                    {/* Daily Summaries inside cell */}
                    {hasData && (
                      <div className="flex flex-col text-[10px] font-black items-end space-y-0.5 mt-1 select-none pr-0.5">
                        {income > 0 && (
                          <span className="text-blue-600 leading-none">
                            {formatCompactKrw(income, '+')}
                          </span>
                        )}
                        {spending > 0 && (
                          <span className="text-rose-600 leading-none">
                            {formatCompactKrw(spending, '-')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom details panel for Selected Date */}
          <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-extrabold text-slate-800">
                  📅 {selectedDateStr.split('-')[0]}년 {selectedDateStr.split('-')[1]}월 {selectedDateStr.split('-')[2]}일 상세 내역
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">선택한 날짜의 수입 및 지출 명세서입니다.</p>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold shrink-0">
                {selectedDateTotals.income > 0 && (
                  <span className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                    수입: {formatKrw(selectedDateTotals.income)}
                  </span>
                )}
                {selectedDateTotals.spending > 0 && (
                  <span className="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                    지출: {formatKrw(selectedDateTotals.spending)}
                  </span>
                )}
              </div>
            </div>

            {selectedDateTxs.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                해당 날짜에 등록된 거래 내역이 없습니다.<br />
                우측 상단 '내역 추가' 버튼으로 이 날의 첫 내역을 기록해 보세요.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDateTxs.map((t) => {
                  const isIncome = t.type === 'INCOME';
                  const cardBgClass = isIncome ? 'bg-blue-100/30 hover:bg-blue-100/50 border-blue-200/50' : (ROW_BG_STYLES[t.category] || 'bg-white');
                  return (
                    <div 
                      key={t.id} 
                      className={`p-3.5 rounded-xl border border-slate-100/50 flex items-center justify-between transition-all ${cardBgClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          isIncome ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {isIncome ? '수입' : '지출'}
                        </span>
                        
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {t.memo || (isIncome ? '기타 수입' : '기타 지출')}
                            </span>
                            {!isIncome && t.satisfaction && t.satisfaction !== 'NORMAL' && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                t.satisfaction === 'SATISFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>
                                {t.satisfaction === 'SATISFIED' ? '🥰 만족' : '💸 후회'}
                              </span>
                            )}
                            {t.isFixed && (
                              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-extrabold rounded-md border border-blue-100">
                                <Pin className="w-2 h-2 fill-blue-600" />
                                고정
                              </span>
                            )}
                          </div>
                          {!isIncome && (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {CATEGORY_LABELS[t.category]}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className={`text-sm font-extrabold ${isIncome ? 'text-blue-600' : 'text-slate-800'}`}>
                          {isIncome ? '+' : '-'}{formatKrw(t.amount)}
                        </span>
                        
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-all"
                            title="수정"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('정말 삭제하시겠습니까? (고정 지출은 전체 기간에서 함께 삭제됩니다)')) {
                                onDelete(t.id);
                              }
                            }}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-all"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {editingId ? '가계부 내역 수정' : '새 가계부 내역 등록'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Type Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setType('SPENDING')}
                  className={`flex-1 py-1.5 text-center text-xs font-bold rounded-md transition-all ${
                    type === 'SPENDING' 
                      ? 'bg-white text-rose-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  지출
                </button>
                <button
                  type="button"
                  onClick={() => setType('INCOME')}
                  className={`flex-1 py-1.5 text-center text-xs font-bold rounded-md transition-all ${
                    type === 'INCOME' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  수입
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  금액 (원)
                </label>
                <input
                  type="number"
                  placeholder="예: 15000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  required
                />
              </div>

              {/* Category (spending only) */}
              {type === 'SPENDING' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    카테고리
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm bg-white"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  날짜
                </label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  required
                />
              </div>

              {/* Memo */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  메모
                </label>
                <input
                  type="text"
                  placeholder="예: 점심식사, 월세 등"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              {/* Satisfaction (spending only) */}
              {type === 'SPENDING' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    소비 만족도
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: 'SATISFIED', label: '🥰 만족', activeColor: 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/10' },
                      { value: 'NORMAL', label: '😐 평범', activeColor: 'bg-slate-50 text-slate-700 border-slate-300 ring-2 ring-slate-500/10' },
                      { value: 'REGRET', label: '💸 후회', activeColor: 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/10' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSatisfaction(opt.value)}
                        className={`flex-1 py-2 text-center text-xs font-bold rounded-lg border transition-all ${
                          satisfaction === opt.value
                            ? opt.activeColor
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fixed Checkbox */}
              <div className="flex items-center gap-2 pt-1.5 pl-0.5">
                <input
                  type="checkbox"
                  id="isFixed"
                  checked={isFixed}
                  onChange={(e) => setIsFixed(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 transition-colors"
                />
                <label htmlFor="isFixed" className="text-xs font-bold text-slate-600 cursor-pointer">
                  매달 고정 거래로 등록 (매월 자동 반영)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-all text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-all text-xs"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
