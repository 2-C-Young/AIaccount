package com.coach.spending.service;

import com.coach.spending.model.Transaction;
import com.coach.spending.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PromptService {
    
    public String buildPrompt(User user, List<Transaction> transactions, String userQuestion) {
        LocalDate now = LocalDate.now();
        
        // Calculate totals for the current month
        long monthlyIncome = user.getIncome();
        long goalSaving = user.getGoalSaving();
        
        long currentMonthSpending = 0;
        long currentMonthIncome = 0;
        
        StringBuilder transactionListText = new StringBuilder();
        
        for (Transaction t : transactions) {
            boolean isCurrentMonth = t.getTransactionDate().getYear() == now.getYear() && 
                                     t.getTransactionDate().getMonthValue() == now.getMonthValue();
            
            if (isCurrentMonth) {
                if (t.getType() == com.coach.spending.model.TransactionType.SPENDING) {
                    currentMonthSpending += t.getAmount();
                } else {
                    currentMonthIncome += t.getAmount();
                }
            }
            
            transactionListText.append(String.format("- [%s] %s %d원 (%s) - %s\n",
                    t.getTransactionDate(),
                    t.getType() == com.coach.spending.model.TransactionType.INCOME ? "수입" : "지출",
                    t.getAmount(),
                    t.getCategory().name(),
                    t.getMemo() != null ? t.getMemo() : ""
            ));
        }
        
        long remainingBudget = monthlyIncome - goalSaving - currentMonthSpending;

        return String.format(
            "당신은 전문 금융 컨설턴트이자 친절한 AI 소비 코치입니다. 사용자의 소비 패턴을 분석하고 올바른 소비 습관을 위한 조언을 작성해 주세요.\n\n" +
            "[사용자 정보]\n" +
            "- 월 고정 수입: %,d원\n" +
            "- 이번 달 목표 저축액: %,d원\n" +
            "- 이번 달 현재까지 수입: %,d원\n" +
            "- 이번 달 현재까지 지출: %,d원\n" +
            "- 목표 대비 남은 예산(소비 가능한 금액 = 월 수입 - 목표 저축액 - 현재 지출): %,d원\n\n" +
            "[소비/수입 내역 전체 목록]\n" +
            "%s\n" +
            "[사용자 질문]\n" +
            "\"%s\"\n\n" +
            "위의 정보와 소비 내역을 바탕으로 사용자의 질문에 답해 주세요.\n" +
            "답변 지침:\n" +
            "1. 한국어로 친절하고 전문적으로 답변하세요.\n" +
            "2. 구체적인 수치(남은 예산, 지출액 등)를 언급하여 설득력을 높이세요.\n" +
            "3. 소비 습관 개선을 위한 실천적인 팁을 1-2개 포함해 주세요.\n" +
            "4. 마크다운 형식을 적극 활용하여 가독성 있게 구성해 주세요.",
            monthlyIncome, goalSaving, currentMonthIncome, currentMonthSpending, remainingBudget,
            transactionListText.length() > 0 ? transactionListText.toString() : "(내역 없음)\n",
            userQuestion
        );
    }

    public String buildSummaryPrompt(User user, List<Transaction> transactions) {
        LocalDate now = LocalDate.now();
        long monthlyIncome = user.getIncome();
        long currentMonthSpending = 0;
        
        for (Transaction t : transactions) {
            boolean isCurrentMonth = t.getTransactionDate().getYear() == now.getYear() && 
                                     t.getTransactionDate().getMonthValue() == now.getMonthValue();
            if (isCurrentMonth && t.getType() == com.coach.spending.model.TransactionType.SPENDING) {
                currentMonthSpending += t.getAmount();
            }
        }
        
        return String.format(
            "사용자의 이번 달 수입은 %,d원이고, 지출은 %,d원이며, 목표 저축액은 %,d원입니다. " +
            "이 정보를 바탕으로 전문 자산 관리사 관점에서 아래 형식에 맞춰 오직 '정확히 2줄의 문장'으로 조언을 작성해 주세요. 다른 서론이나 부연 설명은 절대 하지 마세요.\n\n" +
            "1번째 줄: 현재 사용자의 소비 상태가 어떤지 객체적인 수치를 들어 평가합니다.\n" +
            "2번째 줄: 목표 저축액 달성을 위해 앞으로 소비를 어떻게 통제하고 대처해야 하는지 구체적인 가이드를 제공합니다.",
            monthlyIncome, currentMonthSpending, user.getGoalSaving()
        );
    }
}
