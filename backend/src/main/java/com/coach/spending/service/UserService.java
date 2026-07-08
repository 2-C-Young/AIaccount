package com.coach.spending.service;

import com.coach.spending.model.Transaction;
import com.coach.spending.model.User;
import com.coach.spending.repository.UserRepository;
import com.coach.spending.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Transactional
    public User createUser(User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new IllegalStateException("Username already exists");
        }
        User savedUser = userRepository.save(user);
        syncMonthlyIncomeTransaction(savedUser);
        return savedUser;
    }

    @Transactional
    public User updateUser(Long userId, User userDetails) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setIncome(userDetails.getIncome());
        if (userDetails.getCoachPersona() != null) {
            user.setCoachPersona(userDetails.getCoachPersona());
        }
        if (userDetails.getTargetAmount() != null) {
            user.setTargetAmount(userDetails.getTargetAmount());
        }
        if (userDetails.getTargetPeriodMonths() != null) {
            user.setTargetPeriodMonths(userDetails.getTargetPeriodMonths());
        }
        
        // 장기 목표 기반 월 목표 저축액 자동 연산
        if (user.getTargetAmount() != null && user.getTargetPeriodMonths() != null && user.getTargetPeriodMonths() > 0) {
            user.setGoalSaving(user.getTargetAmount() / user.getTargetPeriodMonths());
        }
        if (userDetails.getLastAiReport() != null) {
            user.setLastAiReport(userDetails.getLastAiReport());
        }
        if (userDetails.getLastAiReportPersona() != null) {
            user.setLastAiReportPersona(userDetails.getLastAiReportPersona());
        }
        User savedUser = userRepository.save(user);
        syncMonthlyIncomeTransaction(savedUser);
        return savedUser;
    }

    public void syncMonthlyIncomeTransaction(User user) {
        if (user.getIncome() == null || user.getIncome() <= 0) {
            return;
        }
        
        LocalDate now = LocalDate.now();
        int year = now.getYear();
        int month = now.getMonthValue();
        
        List<Transaction> all = transactionRepository.findByUserOrderByTransactionDateDesc(user);
        Optional<Transaction> autoIncomeOpt = all.stream()
                .filter(t -> t.getType() == com.coach.spending.model.TransactionType.INCOME && 
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
                    .type(com.coach.spending.model.TransactionType.INCOME)
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
