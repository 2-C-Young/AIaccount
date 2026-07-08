package com.coach.spending.controller;

import com.coach.spending.model.Transaction;
import com.coach.spending.model.User;
import com.coach.spending.service.GeminiService;
import com.coach.spending.service.PromptService;
import com.coach.spending.service.TransactionService;
import com.coach.spending.service.UserService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final UserService userService;
    private final TransactionService transactionService;
    private final PromptService promptService;
    private final GeminiService geminiService;

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestHeader("X-User-Id") Long userId, @RequestBody ChatRequest request) {
        Optional<User> userOpt = userService.getUserById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ChatResponse("사용자 설정이 완료되지 않았습니다."));
        }

        User user = userOpt.get();
        List<Transaction> transactions = transactionService.getAllTransactions(user);
        
        String prompt = promptService.buildChatPrompt(
            user, 
            transactions, 
            request.getQuestion(), 
            request.getPersona() != null ? request.getPersona() : user.getCoachPersona(), 
            request.getCurrentReport() != null ? request.getCurrentReport() : user.getLastAiReport()
        );
        String answer = geminiService.callGemini(prompt);

        return ResponseEntity.ok(new ChatResponse(answer));
    }

    @PostMapping("/report")
    public ResponseEntity<ReportResponse> generateReport(@RequestHeader("X-User-Id") Long userId, @RequestParam(value = "persona", required = false) String persona) {
        Optional<User> userOpt = userService.getUserById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        User user = userOpt.get();
        String selectedPersona = (persona != null && !persona.trim().isEmpty()) ? persona : user.getCoachPersona();
        List<Transaction> transactions = transactionService.getAllTransactions(user);
        
        String prompt = promptService.buildReportPrompt(user, transactions, selectedPersona);
        String report = geminiService.callGemini(prompt);
        
        // Save to user
        user.setLastAiReport(report);
        user.setLastAiReportPersona(selectedPersona);
        user.setCoachPersona(selectedPersona);
        userService.updateUser(user.getId(), user);
        
        return ResponseEntity.ok(new ReportResponse(report, selectedPersona));
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatRequest {
        private String question;
        private String persona;
        private String currentReport;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatResponse {
        private String answer;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportResponse {
        private String report;
        private String persona;
    }
}
