package com.prepPilot.core.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "student_profiles")
@Getter @Setter @NoArgsConstructor
public class StudentProfile {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    private String branch;

    @Column(name = "graduation_year")
    private Integer graduationYear;

    private BigDecimal cgpa;

    @Column(name = "target_company_type")
    private String targetCompanyType;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        this.updatedAt = Instant.now();
    }
}