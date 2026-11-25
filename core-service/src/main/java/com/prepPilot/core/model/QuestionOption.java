package com.prepPilot.core.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "question_options")
@Getter @Setter @NoArgsConstructor
public class QuestionOption {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false, columnDefinition = "text")
    private String body;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;
}