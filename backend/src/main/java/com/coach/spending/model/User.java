package com.coach.spending.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Builder.Default
    private Long income = 3000000L;      // 월 수입

    @Builder.Default
    private Long goalSaving = 500000L;  // 목표 저축액

    @Builder.Default
    private String coachPersona = "SPICY";

    @Builder.Default
    private Long targetAmount = 30000000L;

    @Builder.Default
    private Integer targetPeriodMonths = 60;

    @Column(columnDefinition = "TEXT")
    private String lastAiReport;

    private String lastAiReportPersona;
}
