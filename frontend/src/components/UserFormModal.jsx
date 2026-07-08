import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function UserFormModal({ isOpen, onSubmit, onClose, initialData }) {
  if (!isOpen) return null;

  const [income, setIncome] = useState(initialData?.income || '');
  
  const initialPeriod = initialData?.targetPeriodMonths || 60;
  const [targetYears, setTargetYears] = useState(Math.floor(initialPeriod / 12));
  const [targetMonths, setTargetMonths] = useState(initialPeriod % 12);
  const [targetAmountTenThousand, setTargetAmountTenThousand] = useState(
    initialData?.targetAmount ? Math.round(initialData.targetAmount / 10000) : 3000
  );
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!income || !targetAmountTenThousand) {
      setError('모든 필드를 입력해 주세요.');
      return;
    }
    if (isNaN(income) || income < 0 || isNaN(targetAmountTenThousand) || targetAmountTenThousand < 0) {
      setError('올바른 금액을 입력해 주세요.');
      return;
    }
    
    const totalMonths = (Number(targetYears) * 12) + Number(targetMonths);
    const amountInWon = Number(targetAmountTenThousand) * 10000;

    if (totalMonths <= 0) {
      setError('목표 기간은 최소 1개월 이상이어야 합니다.');
      return;
    }
    
    const computedGoalSaving = Math.round(amountInWon / totalMonths);
    if (computedGoalSaving > Number(income)) {
      setError(`계산된 월 목표 저축액(${new Intl.NumberFormat('ko-KR').format(computedGoalSaving)}원)이 월 소득보다 클 수 없습니다. 기간을 늘리거나 목표 금액을 낮춰 주세요.`);
      return;
    }

    onSubmit({
      income: Number(income),
      targetAmount: amountInWon,
      targetPeriodMonths: totalMonths,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? '사용자 정보 수정' : '환영합니다! 초기 설정'}
          </h2>
          {initialData && onClose && (
            <button 
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-sm text-slate-500 mb-6">
          {initialData 
            ? '월 소득과 장기 저축 목표를 변경할 수 있습니다.' 
            : '서비스 시작을 위해 월 소득과 장기 저축 목표를 입력해 주세요.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              월 소득 (원)
            </label>
            <input
              type="number"
              placeholder="예: 3000000"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-700">🔮 장기 저축 목표 설정</h3>
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                목표 기간
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <select
                    value={targetYears}
                    onChange={(e) => setTargetYears(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}년</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <select
                    value={targetMonths}
                    onChange={(e) => setTargetMonths(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={i}>{i}개월</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1 flex justify-between">
                <span>목표 금액</span>
                <span className="text-blue-600 font-bold">
                  {new Intl.NumberFormat('ko-KR').format(Number(targetAmountTenThousand || 0) * 10000)}원
                </span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  placeholder="예: 3000"
                  value={targetAmountTenThousand}
                  onChange={(e) => setTargetAmountTenThousand(e.target.value)}
                  className="w-full pl-4 pr-12 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <span className="absolute right-4 text-sm text-slate-400 font-medium">만원</span>
              </div>
            </div>

            {targetAmountTenThousand && ((targetYears * 12) + targetMonths) > 0 && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex justify-between text-xs text-slate-500 font-medium">
                <span>월 목표 저축액 (자동 계산)</span>
                <span className="text-slate-700 font-bold">
                  {new Intl.NumberFormat('ko-KR').format(Math.round((Number(targetAmountTenThousand) * 10000) / ((targetYears * 12) + targetMonths)))}원
                </span>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium">{error}</p>
          )}

          <div className="flex gap-2.5 pt-2">
            {initialData && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg transition-all text-sm"
              >
                취소
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm hover:shadow transition-all text-sm"
            >
              저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
