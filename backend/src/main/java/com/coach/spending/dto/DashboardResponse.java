package com.coach.spending.dto;

import com.coach.spending.model.Transaction;
import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class DashboardResponse {
    private Long monthlyIncome;       // 월 소득 (설정된 값)
    private Long goalSaving;          // 목표 저축액 (설정된 값)
    private Long thisMonthIncome;     // 이번 달 실제 등록된 수입 총합
    private Long thisMonthSpending;   // 이번 달 실제 등록된 지출 총합
    private Long remainingBudget;     // 남은 예산 (월 소득 - 목표 저축액 - 이번 달 지출)
    private List<Transaction> recentTransactions; // 최근 거래 내역 리스트
    private Map<String, Long> spendingByCategory; // 카테고리별 지출 금액 합계
    private String aiSummary;         // AI 한 줄 요약
    private boolean userExists;       // 사용자 등록 여부

    // 장기 목표 연동 필드
    private Long targetAmount;         // 장기 목표 금액 (설정된 값)
    private Integer targetPeriodMonths; // 장기 목표 기간 (설정된 값, 개월 수)
    private Long totalSavedAmount;     // 가계부 누적 실제 순저축액
}
