package com.prepPilot.core.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "test_cases")
@Getter @Setter @NoArgsConstructor
public class TestCase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "problem_id", nullable = false)
    private CodingProblem codingProblem;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "input_data", nullable = false, columnDefinition = "text")
    private String inputData;

    @Column(name = "expected_output", nullable = false, columnDefinition = "text")
    private String expectedOutput;

    // Hidden unless someone deliberately makes it a visible sample.
    @Column(name = "is_hidden", nullable = false)
    private boolean hidden = true;
}