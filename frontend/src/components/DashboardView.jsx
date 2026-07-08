import React, { useState } from 'react';
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

const CATEGORY_HEX_COLORS = {
  FOOD: '#f97316',
  SHOPPING: '#ec4899',
  HOUSING: '#6366f1',
  TRANSPORTATION: '#06b6d4',
  MEDICAL: '#10b981',
  EDUCATION: '#a855f7',
  LEISURE: '#eab308',
  ETC: '#64748b'
};

export default function DashboardView({ data, onEditProfile, aiSummary, aiSummaryLoading, onFetchSummary }) {
  if (!data) return null;

  const [hoveredCategory, setHoveredCategory] = useState(null);

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

  // 도넛 차트용 conic-gradient 스타일 동적 빌드
  let accumPercent = 0;
  const gradientSlices = spendingList.map((item) => {
    const percent = totalSpending > 0 ? (item.amount / totalSpending) * 100 : 0;
    const start = accumPercent;
    accumPercent += percent;
    const colorHex = CATEGORY_HEX_COLORS[item.cat] || '#cbd5e1';
    return `${colorHex} ${start.toFixed(2)}% ${accumPercent.toFixed(2)}%`;
  });
  const conicGradientStyle = {
    background: spendingList.length > 0 
      ? `conic-gradient(${gradientSlices.join(', ')})` 
      : '#f1f5f9'
  };

  const handleMouseMove = (e) => {
    if (spendingList.length === 0 || totalSpending === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    
    angle = angle + 90;
    if (angle < 0) angle += 360;
    
    let currentAngle = 0;
    for (const item of spendingList) {
      const percent = (item.amount / totalSpending) * 100;
      const sliceAngle = (percent / 100) * 360;
      if (angle >= currentAngle && angle < currentAngle + sliceAngle) {
        setHoveredCategory(item);
        return;
      }
      currentAngle += sliceAngle;
    }
  };

  const handleMouseLeave = () => {
    setHoveredCategory(null);
  };

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

      {/* Long-term Savings Goal Card */}
      {data.targetAmount && data.targetPeriodMonths && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  장기 저축 목표 달성 현황
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {Math.floor(data.targetPeriodMonths / 12)}년 {data.targetPeriodMonths % 12}개월 동안 {formatKrw(data.targetAmount)} 모으기
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {data.goalSaving >= (data.targetPeriodMonths > 0 ? Math.max(0, Math.round((data.targetAmount - data.totalSavedAmount) / data.targetPeriodMonths)) : 0) ? (
                <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-md font-bold">
                  🟢 순항 중
                </span>
              ) : (
                <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-1 rounded-md font-bold">
                  ⚠️ 조정 필요
                </span>
              )}
              <span className="text-lg font-black text-indigo-600">
                {Math.max(0, Math.min(Math.round((data.totalSavedAmount / data.targetAmount) * 100), 100))}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.max(0, Math.min(Math.round((data.totalSavedAmount / data.targetAmount) * 100), 100))}%` }}
              />
            </div>
            
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>현재 누적: {formatKrw(data.totalSavedAmount)}</span>
              <span>목표액: {formatKrw(data.targetAmount)}</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center justify-between">
              <span>목표 달성을 위한 월 필수 저축액:</span>
              <span className="font-bold text-slate-800">
                {formatKrw(data.targetPeriodMonths > 0 ? Math.max(0, Math.round((data.targetAmount - data.totalSavedAmount) / data.targetPeriodMonths)) : 0)} / 월
              </span>
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed pt-1.5 border-t border-slate-100">
              {data.goalSaving >= (data.targetPeriodMonths > 0 ? Math.max(0, Math.round((data.targetAmount - data.totalSavedAmount) / data.targetPeriodMonths)) : 0) ? (
                <span>현재 설정된 월 목표 저축액({formatKrw(data.goalSaving)})이 필수 페이스({formatKrw(data.targetPeriodMonths > 0 ? Math.max(0, Math.round((data.targetAmount - data.totalSavedAmount) / data.targetPeriodMonths)) : 0)})보다 많아 안정적으로 도달할 수 있습니다. 남는 예산은 보너스 저축으로 합산됩니다!</span>
              ) : (
                <span>현재 설정된 월 목표 저축액({formatKrw(data.goalSaving)})이 필수 페이스({formatKrw(data.targetPeriodMonths > 0 ? Math.max(0, Math.round((data.targetAmount - data.totalSavedAmount) / data.targetPeriodMonths)) : 0)})에 미치지 못합니다. 월 저축 목표를 올리거나 낭비를 줄여 저축률을 극대화해야 합니다!</span>
              )}
            </div>
          </div>
        </div>
      )}

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
              {/* Custom Donut Chart */}
              <div className="flex justify-center py-4">
                <div 
                  className="relative w-40 h-40 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-transform duration-300 hover:scale-[1.03]"
                  style={conicGradientStyle}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Center circle to make it a Donut Chart */}
                  <div className="absolute w-28 h-28 bg-white rounded-full flex flex-col items-center justify-center shadow-inner select-none pointer-events-none transition-all duration-300">
                    {hoveredCategory ? (
                      <>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_COLORS[hoveredCategory.cat]}`} />
                          {CATEGORY_LABELS[hoveredCategory.cat]}
                        </span>
                        <span className="text-sm font-extrabold text-slate-800 mt-0.5">
                          {formatKrw(hoveredCategory.amount)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {totalSpending > 0 ? Math.round((hoveredCategory.amount / totalSpending) * 100) : 0}%
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">총 소비</span>
                        <span className="text-sm font-extrabold text-slate-800 mt-0.5">{formatKrw(totalSpending)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Category Legend list */}
              <div className="space-y-1.5 pt-2">
                {spendingList.map((item) => {
                  const percent = totalSpending > 0 ? Math.round((item.amount / totalSpending) * 100) : 0;
                  const isHovered = hoveredCategory?.cat === item.cat;
                  return (
                    <div 
                      key={item.cat} 
                      className={`flex items-center justify-between text-sm p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                        isHovered ? 'bg-slate-50 translate-x-1 shadow-sm' : 'hover:bg-slate-50/50'
                      }`}
                      onMouseEnter={() => setHoveredCategory(item)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${CATEGORY_COLORS[item.cat]} ${isHovered ? 'scale-125' : ''} transition-transform`} />
                        <span className={`text-slate-600 ${isHovered ? 'font-bold text-slate-800' : 'font-medium'}`}>{CATEGORY_LABELS[item.cat]}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${isHovered ? 'text-blue-600' : 'text-slate-800'}`}>{formatKrw(item.amount)}</span>
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
