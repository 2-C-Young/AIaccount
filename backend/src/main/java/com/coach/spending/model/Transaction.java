package com.coach.spending.model;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long amount;

    @Enumerated(EnumType.STRING)
    private Category category;

    private String memo;

    private LocalDate transactionDate;

    @Enumerated(EnumType.STRING)
    private TransactionType type;

    private Boolean isFixed; // 고정 지출 여부

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Satisfaction satisfaction = Satisfaction.NORMAL;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
