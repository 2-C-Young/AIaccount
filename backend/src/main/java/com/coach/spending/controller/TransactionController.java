package com.coach.spending.controller;

import com.coach.spending.model.Transaction;
import com.coach.spending.model.User;
import com.coach.spending.service.TransactionService;
import com.coach.spending.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final UserService userService;

    private Optional<User> getUser(Long userId) {
        return userService.getUserById(userId);
    }

    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions(@RequestHeader("X-User-Id") Long userId) {
        return getUser(userId)
                .map(user -> ResponseEntity.ok(transactionService.getAllTransactions(user)))
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    @PostMapping
    public ResponseEntity<Transaction> createTransaction(@RequestHeader("X-User-Id") Long userId, @RequestBody Transaction transaction) {
        return getUser(userId)
                .map(user -> ResponseEntity.ok(transactionService.createTransaction(user, transaction)))
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Transaction> updateTransaction(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id, @RequestBody Transaction transaction) {
        Optional<User> userOpt = getUser(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            return ResponseEntity.ok(transactionService.updateTransaction(userOpt.get(), id, transaction));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        Optional<User> userOpt = getUser(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            transactionService.deleteTransaction(userOpt.get(), id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}
