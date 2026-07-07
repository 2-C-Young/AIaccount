package com.coach.spending.service;

import com.coach.spending.model.Transaction;
import com.coach.spending.model.User;
import com.coach.spending.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {
    private final TransactionRepository transactionRepository;

    public List<Transaction> getAllTransactions(User user) {
        List<Transaction> realTransactions = transactionRepository.findByUserOrderByTransactionDateDesc(user);
        List<Transaction> result = new ArrayList<>(realTransactions);
        
        LocalDate now = LocalDate.now();
        
        // Generate virtual recurring entries for display
        for (Transaction t : realTransactions) {
            if (Boolean.TRUE.equals(t.getIsFixed())) {
                LocalDate origDate = t.getTransactionDate();
                // Generate replicas for each month between origDate and now
                LocalDate temp = origDate.plusMonths(1).withDayOfMonth(1);
                while (!temp.isAfter(now.withDayOfMonth(1))) {
                    int targetDay = Math.min(origDate.getDayOfMonth(), temp.lengthOfMonth());
                    LocalDate virtualDate = LocalDate.of(temp.getYear(), temp.getMonth(), targetDay);
                    
                    Transaction clone = Transaction.builder()
                            .id(t.getId()) // Use same ID so operations act on the original
                            .amount(t.getAmount())
                            .category(t.getCategory())
                            .memo(t.getMemo() + " (매월 고정)")
                            .transactionDate(virtualDate)
                            .type(t.getType())
                            .isFixed(true)
                            .user(user)
                            .build();
                    result.add(clone);
                    temp = temp.plusMonths(1);
                }
            }
        }
        
        // Sort all by date descending
        result.sort(Comparator.comparing(Transaction::getTransactionDate).reversed()
                .thenComparing(Transaction::getId, Comparator.reverseOrder()));
        return result;
    }

    public List<Transaction> getTransactionsInMonth(User user, LocalDate date) {
        LocalDate start = date.withDayOfMonth(1);
        LocalDate end = date.withDayOfMonth(date.lengthOfMonth());
        
        List<Transaction> inMonth = transactionRepository.findByUserAndTransactionDateBetweenOrderByTransactionDateDesc(user, start, end);
        List<Transaction> result = new ArrayList<>(inMonth);
        
        // Find all fixed transactions created before this month
        List<Transaction> allTxs = transactionRepository.findByUserOrderByTransactionDateDesc(user);
        for (Transaction t : allTxs) {
            if (Boolean.TRUE.equals(t.getIsFixed()) && t.getTransactionDate().isBefore(start)) {
                LocalDate origDate = t.getTransactionDate();
                int targetDay = Math.min(origDate.getDayOfMonth(), date.lengthOfMonth());
                LocalDate virtualDate = LocalDate.of(date.getYear(), date.getMonth(), targetDay);
                
                Transaction clone = Transaction.builder()
                        .id(t.getId())
                        .amount(t.getAmount())
                        .category(t.getCategory())
                        .memo(t.getMemo() + " (매월 고정)")
                        .transactionDate(virtualDate)
                        .type(t.getType())
                        .isFixed(true)
                        .user(user)
                        .build();
                result.add(clone);
            }
        }
        
        result.sort(Comparator.comparing(Transaction::getTransactionDate).reversed());
        return result;
    }

    @Transactional
    public Transaction createTransaction(User user, Transaction transaction) {
        transaction.setUser(user);
        if (transaction.getTransactionDate() == null) {
            transaction.setTransactionDate(LocalDate.now());
        }
        if (transaction.getIsFixed() == null) {
            transaction.setIsFixed(false);
        }
        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction updateTransaction(User user, Long id, Transaction transactionDetails) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found with id: " + id));
        
        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("Unauthorized to update this transaction");
        }
        
        transaction.setAmount(transactionDetails.getAmount());
        transaction.setCategory(transactionDetails.getCategory());
        transaction.setMemo(transactionDetails.getMemo());
        transaction.setTransactionDate(transactionDetails.getTransactionDate());
        transaction.setType(transactionDetails.getType());
        transaction.setIsFixed(transactionDetails.getIsFixed() != null ? transactionDetails.getIsFixed() : false);
        
        return transactionRepository.save(transaction);
    }

    @Transactional
    public void deleteTransaction(User user, Long id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found with id: " + id));
        
        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("Unauthorized to delete this transaction");
        }
        
        transactionRepository.delete(transaction);
    }
}
