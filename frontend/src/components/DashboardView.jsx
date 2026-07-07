import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, Award, Sparkles } from 'lucide-react';

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

const CATEGORY_COLORS = {
  FOOD: 'bg-orange-500',
  SHOPPING: 'bg-pink-500',
  HOUSING: 'bg-indigo-500',
  TRANSPORTATION: 'bg-cyan-500',
  MEDICAL: 'bg-emerald-500',
  EDUCATION: 'bg-purple-500',
  LEISURE: 'bg-yellow-500',
  ETC: 'bg-slate-500'
};

const CATEGORY_TEXT_COLORS = {
  FOOD: 'text-orange-600',
  SHOPPING: 'text-pink-600',
  HOUSING: 'text-indigo-600',
  TRANSPORTATION: 'text-cyan-600',
  MEDICAL: 'text-emerald-600',
  EDUCATION: 'text-purple-600',
  LEISURE: 'text-yellow-600',
  ETC: 'text-slate-600'
};

export default function DashboardView({ data, onEditProfile, aiSummary, aiSummaryLoading, onFetchSummary }) {
  if (!data) return null;

  const formatKrw = (val) => {
    return new Intl.NumberFormat('ko-KR').format(val || 0) + '원';
  };

  // Calculate percentage of budget used (uncapped)
  const totalBudget = data.monthlyIncome - data.goalSaving;
  const budgetSpentPercent = totalBudget > 0 
    ? Math.round((data.thisMonthSpending / totalBudget) * 100) 
    : 0;

  // Filter out non-zero categories
  const spendingList = Object.entries(data.spendingByCategory || {})
    .map(([cat, amount]) => ({ cat, amount }))
    .filter(item => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const totalSpending = spendingList.reduce((acc, cur) => acc + cur.amount, 0);

  // Predictor calculations (Frontend-only, 100% safe)
  const today = new Date();
  const dayOfMonth = today.getDate();
  const totalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = totalDays - dayOfMonth;

  const dailyAverage = dayOfMonth > 0 ? data.thisMonthSpending / dayOfMonth : 0;
  const projectedSpending = dailyAverage * totalDays;
  const projectedSavings = data.monthlyIncome - projectedSpending;
  
  let targetStatus = 'SAFE'; 
  let statusMessage = '';
  let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
  let dotColor = 'bg-emerald-500';

  if (data.thisMonthSpending > totalBudget) {
    targetStatus = 'DANGER';
    statusMessage = '⚠️ 목표 저축 달성 불가능: 이번 달 가용 예산을 이미 초과하여 지출했습니다.';
    statusColor = 'text-rose-700 bg-rose-50 border-rose-100';
    dotColor = 'bg-rose-500';
  } else if (projectedSavings < data.goalSaving) {
    targetStatus = 'WARNING';
    const maxAllowedSpendingRemaining = totalBudget - data.thisMonthSpending;
    const maxDailyAllowed = daysRemaining > 0 ? maxAllowedSpendingRemaining / daysRemaining : 0;
    statusMessage = `⚠️ 주의: 현재 페이스 유지 시 달성이 어렵습니다. 남은 ${daysRemaining}일 동안 하루 평균 ${new Intl.NumberFormat('ko-KR').format(Math.round(Math.max(0, maxDailyAllowed)))}원 이하로 소비해야 달성 가능합니다.`;
    statusColor = 'text-amber-700 bg-amber-50 border-amber-100';
    dotColor = 'bg-amber-500';
  } else {
    targetStatus = 'SAFE';
    statusMessage = '🟢 양호: 현재 소비 페이스를 잘 유지하고 계십니다! 이대로라면 목표 저축액을 무난히 달성할 수 있습니다.';
    statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
    dotColor = 'bg-emerald-500';
  }

  return (
    <div className="space-y-6">
      {/* Upper stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Monthly Income Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold mb-1">이번 달 수입</p>
            <p className="text-xl font-bold text-slate-800">{formatKrw(data.monthlyIncome)}</p>
            <button 
              onClick={onEditProfile} 
              className="text-xs text-blue-600 hover:text-blue-700 mt-1 font-medium underline"
            >
              설정 수정
            </button>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Goal Saving Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold mb-1">목표 저축액</p>
            <p className="text-xl font-bold text-slate-800">{formatKrw(data.goalSaving)}</p>
            <p className="text-xs text-slate-400 mt-1">수입의 {data.monthlyIncome > 0 ? Math.round((data.goalSaving / data.monthlyIncome) * 100) : 0}%</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Current Spending Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold mb-1">이번 달 지출</p>
            <p className="text-xl font-bold text-slate-800">{formatKrw(data.thisMonthSpending)}</p>
            <p className="text-xs text-slate-400 mt-1">가용 예산 대비 {budgetSpentPercent}% 사용</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Remaining Budget Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold mb-1">남은 예산</p>
            <p className={`text-xl font-bold ${data.remainingBudget < 0 ? 'text-red-500' : 'text-blue-600'}`}>
              {formatKrw(data.remainingBudget)}
            </p>
            <p className="text-xs text-slate-400 mt-1">예산: {formatKrw(totalBudget)}</p>
          </div>
          <div className={`p-3 rounded-xl ${data.remainingBudget < 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Budget Progress & Savings Goal Predictor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Budget Progress Bar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">예산 소진 현황</h3>
              <p className="text-xs text-slate-400 mt-0.5">이번 달 가용 예산 {formatKrw(totalBudget)} 중 {formatKrw(data.thisMonthSpending)} 지출</p>
            </div>
            <span className={`text-sm font-black ${budgetSpentPercent > 100 ? 'text-red-500 animate-pulse' : 'text-blue-600'}`}>
              {budgetSpentPercent}%
            </span>
          </div>
          
          <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                budgetSpentPercent > 100 ? 'bg-red-500' : budgetSpentPercent > 80 ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(budgetSpentPercent, 100)}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>0%</span>
            <span>50%</span>
            <span>100% (한도)</span>
          </div>
        </div>

        {/* Savings Goal Status Predictor */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className={`w-2.5 h-2.5 rounded-full ${dotColor} ${targetStatus !== 'SAFE' ? 'animate-ping' : 'animate-pulse'}`} />
              <h3 className="text-sm font-bold text-slate-800">목표 저축 신호등</h3>
            </div>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              이번 달 예상 저축액: <strong className="text-slate-800">{formatKrw(Math.max(0, Math.round(projectedSavings)))}</strong>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              (목표 저축액: {formatKrw(data.goalSaving)})
            </p>
          </div>
          <div className={`mt-3 p-3 rounded-xl border text-xs font-semibold ${statusColor} leading-relaxed`}>
            {statusMessage}
          </div>
        </div>
      </div>

      {/* AI Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-5 rounded-2xl shadow-sm flex items-start gap-4">
        <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200 shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-800">AI 소비 코치 요약</h3>
            <button
              onClick={onFetchSummary}
              disabled={aiSummaryLoading}
              className="py-1 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm hover:shadow"
            >
              {aiSummaryLoading ? '분석 중...' : 'AI 분석 받기'}
            </button>
          </div>
          {aiSummaryLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-3 bg-blue-200 rounded w-5/6"></div>
              <div className="h-3 bg-blue-200 rounded w-3/4"></div>
            </div>
          ) : (
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              {aiSummary || '소비 내역을 추가해 실시간 조언을 받아보세요.'}
            </p>
          )}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Spending Chart Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1">
          <h3 className="text-base font-bold text-slate-800 mb-4">카테고리별 소비</h3>
          {spendingList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm">
              지출 거래가 등록되면<br />차트가 활성화됩니다.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Custom horizontal progress bar chart */}
              <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                {spendingList.map((item) => {
                  const percent = totalSpending > 0 ? (item.amount / totalSpending) * 100 : 0;
                  return (
                    <div
                      key={item.cat}
                      className={CATEGORY_COLORS[item.cat]}
                      style={{ width: `${percent}%` }}
                      title={`${CATEGORY_LABELS[item.cat]}: ${percent.toFixed(1)}%`}
                    />
                  );
                })}
              </div>

              {/* Category Legend list */}
              <div className="space-y-3 pt-2">
                {spendingList.map((item) => {
                  const percent = totalSpending > 0 ? Math.round((item.amount / totalSpending) * 100) : 0;
                  return (
                    <div key={item.cat} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${CATEGORY_COLORS[item.cat]}`} />
                        <span className="text-slate-600 font-medium">{CATEGORY_LABELS[item.cat]}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-800">{formatKrw(item.amount)}</span>
                        <span className="text-xs text-slate-400 ml-1.5">{percent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Recent Transactions Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="text-base font-bold text-slate-800 mb-4">최근 내역</h3>
          {(!data.recentTransactions || data.recentTransactions.length === 0) ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              등록된 수입 및 지출 내역이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">날짜</th>
                    <th className="pb-3">카테고리</th>
                    <th className="pb-3">메모</th>
                    <th className="pb-3 text-right">금액</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {data.recentTransactions.map((t) => {
                    const isIncome = t.type === 'INCOME';
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 text-slate-500 font-medium">{t.transactionDate}</td>
                        <td className="py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isIncome ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {isIncome ? '수입' : CATEGORY_LABELS[t.category]}
                          </span>
                        </td>
                        <td className="py-3 text-slate-700 max-w-[150px] truncate">{t.memo || '-'}</td>
                        <td className={`py-3 text-right font-bold ${
                          isIncome ? 'text-blue-600' : 'text-slate-800'
                        }`}>
                          {isIncome ? '+' : '-'}{formatKrw(t.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
