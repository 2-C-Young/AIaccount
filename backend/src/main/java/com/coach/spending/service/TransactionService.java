package com.coach.spending.service;

import com.coach.spending.model.Transaction;
import com.coach.spending.model.TransactionType;
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
        syncMonthlyIncomeTransaction(user);
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
                            .satisfaction(t.getSatisfaction())
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
        syncMonthlyIncomeTransaction(user);
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
                        .satisfaction(t.getSatisfaction())
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
        if (transaction.getSatisfaction() == null) {
            transaction.setSatisfaction(com.coach.spending.model.Satisfaction.NORMAL);
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
        transaction.setSatisfaction(transactionDetails.getSatisfaction() != null ? transactionDetails.getSatisfaction() : com.coach.spending.model.Satisfaction.NORMAL);
        
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

    public long getTotalSavedAmount(User user) {
        List<Transaction> all = getAllTransactions(user);
        long totalIncome = all.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .mapToLong(Transaction::getAmount)
                .sum();
        long totalSpending = all.stream()
                .filter(t -> t.getType() == TransactionType.SPENDING)
                .mapToLong(Transaction::getAmount)
                .sum();
        return totalIncome - totalSpending;
    }

    public void syncMonthlyIncomeTransaction(User user) {
        if (user.getIncome() == null || user.getIncome() <= 0) {
            return;
        }
        
        LocalDate now = LocalDate.now();
        int year = now.getYear();
        int month = now.getMonthValue();
        
        List<Transaction> all = transactionRepository.findByUserOrderByTransactionDateDesc(user);
        java.util.Optional<Transaction> autoIncomeOpt = all.stream()
                .filter(t -> t.getType() == TransactionType.INCOME && 
                             "[고정] 설정 월 수입".equals(t.getMemo()) && 
                             t.getTransactionDate().getYear() == year && 
                             t.getTransactionDate().getMonthValue() == month)
                .findFirst();
                
        if (autoIncomeOpt.isPresent()) {
            Transaction t = autoIncomeOpt.get();
            if (!t.getAmount().equals(user.getIncome())) {
                t.setAmount(user.getIncome());
                transactionRepository.save(t);
            }
        } else {
            Transaction newIncome = Transaction.builder()
                    .user(user)
                    .type(TransactionType.INCOME)
                    .category(com.coach.spending.model.Category.ETC)
                    .amount(user.getIncome())
                    .memo("[고정] 설정 월 수입")
                    .transactionDate(LocalDate.of(year, month, 10))
                    .isFixed(true)
                    .satisfaction(com.coach.spending.model.Satisfaction.NORMAL)
                    .build();
            transactionRepository.save(newIncome);
        }
    }
}
