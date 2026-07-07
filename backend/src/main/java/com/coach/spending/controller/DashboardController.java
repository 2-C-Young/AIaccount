package com.coach.spending.controller;

import com.coach.spending.dto.DashboardResponse;
import com.coach.spending.model.Category;
import com.coach.spending.model.Transaction;
import com.coach.spending.model.TransactionType;
import com.coach.spending.model.User;
import com.coach.spending.service.GeminiService;
import com.coach.spending.service.PromptService;
import com.coach.spending.service.TransactionService;
import com.coach.spending.service.UserService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final UserService userService;
    private final TransactionService transactionService;
    private final PromptService promptService;
    private final GeminiService geminiService;

    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(@RequestHeader("X-User-Id") Long userId) {
        Optional<User> userOpt = userService.getUserById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(DashboardResponse.builder()
                    .userExists(false)
                    .build());
        }

        User user = userOpt.get();
        LocalDate now = LocalDate.now();
        List<Transaction> thisMonthTransactions = transactionService.getTransactionsInMonth(user, now);
        List<Transaction> allTransactions = transactionService.getAllTransactions(user);

        long thisMonthIncome = thisMonthTransactions.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .mapToLong(Transaction::getAmount)
                .sum();

        long thisMonthSpending = thisMonthTransactions.stream()
                .filter(t -> t.getType() == TransactionType.SPENDING)
                .mapToLong(Transaction::getAmount)
                .sum();

        long remainingBudget = user.getIncome() - user.getGoalSaving() - thisMonthSpending;

        // Get recent 5 transactions
        List<Transaction> recentTransactions = allTransactions.stream()
                .limit(5)
                .collect(Collectors.toList());

        // Group spending by category
        Map<String, Long> spendingByCategory = new HashMap<>();
        for (Category cat : Category.values()) {
            spendingByCategory.put(cat.name(), 0L);
        }
        
        thisMonthTransactions.stream()
                .filter(t -> t.getType() == TransactionType.SPENDING)
                .forEach(t -> {
                    String catName = t.getCategory().name();
                    spendingByCategory.put(catName, spendingByCategory.getOrDefault(catName, 0L) + t.getAmount());
                });

        return ResponseEntity.ok(DashboardResponse.builder()
                .userExists(true)
                .monthlyIncome(user.getIncome())
                .goalSaving(user.getGoalSaving())
                .thisMonthIncome(thisMonthIncome)
                .thisMonthSpending(thisMonthSpending)
                .remainingBudget(remainingBudget)
                .recentTransactions(recentTransactions)
                .spendingByCategory(spendingByCategory)
                .aiSummary(null) // Excluded for performance optimization, fetched via /dashboard/summary
                .build());
    }

    @GetMapping("/summary")
    public ResponseEntity<SummaryResponse> getDashboardSummary(@RequestHeader("X-User-Id") Long userId) {
        Optional<User> userOpt = userService.getUserById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        LocalDate now = LocalDate.now();
        List<Transaction> thisMonthTransactions = transactionService.getTransactionsInMonth(user, now);

        long thisMonthIncome = thisMonthTransactions.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .mapToLong(Transaction::getAmount)
                .sum();

        long thisMonthSpending = thisMonthTransactions.stream()
                .filter(t -> t.getType() == TransactionType.SPENDING)
                .mapToLong(Transaction::getAmount)
                .sum();

        String aiSummary;
        if (thisMonthSpending == 0 && thisMonthIncome == 0) {
            aiSummary = "이번 달 소비 내역이 등록되면 AI 한 줄 조언이 표시됩니다.";
        } else {
            String prompt = promptService.buildSummaryPrompt(user, thisMonthTransactions);
            aiSummary = geminiService.callGemini(prompt);
        }

        return ResponseEntity.ok(new SummaryResponse(aiSummary));
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryResponse {
        private String aiSummary;
    }
}
