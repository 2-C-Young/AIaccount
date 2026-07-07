package com.coach.spending.repository;

import com.coach.spending.model.Transaction;
import com.coach.spending.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserAndTransactionDateBetweenOrderByTransactionDateDesc(User user, LocalDate startDate, LocalDate endDate);
    List<Transaction> findByUserOrderByTransactionDateDesc(User user);
}
