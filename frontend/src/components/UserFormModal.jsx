import React, { useState } from 'react';

export default function UserFormModal({ isOpen, onSubmit, initialData }) {
  if (!isOpen) return null;

  const [income, setIncome] = useState(initialData?.income || '');
  const [goalSaving, setGoalSaving] = useState(initialData?.goalSaving || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!income || !goalSaving) {
      setError('모든 필드를 입력해 주세요.');
      return;
    }
    if (isNaN(income) || isNaN(goalSaving) || income < 0 || goalSaving < 0) {
      setError('올바른 금액을 입력해 주세요.');
      return;
    }
    if (Number(goalSaving) > Number(income)) {
      setError('목표 저축액이 월 소득보다 클 수 없습니다.');
      return;
    }
    onSubmit({
      income: Number(income),
      goalSaving: Number(goalSaving),
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          {initialData ? '사용자 정보 수정' : '환영합니다! 초기 설정'}
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {initialData 
            ? '월 소득과 목표 저축액을 언제든 변경할 수 있습니다.' 
            : '서비스 시작을 위해 월 소득과 이번 달 목표 저축액을 입력해 주세요.'}
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              목표 저축액 (원)
            </label>
            <input
              type="number"
              placeholder="예: 1000000"
              value={goalSaving}
              onChange={(e) => setGoalSaving(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm hover:shadow transition-all text-sm"
          >
            저장하기
          </button>
        </form>
      </div>
    </div>
  );
}
