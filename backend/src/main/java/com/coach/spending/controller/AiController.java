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
        
        String prompt = promptService.buildPrompt(user, transactions, request.getQuestion());
        String answer = geminiService.callGemini(prompt);

        return ResponseEntity.ok(new ChatResponse(answer));
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatRequest {
        private String question;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatResponse {
        private String answer;
    }
}
