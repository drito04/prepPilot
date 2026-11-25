package com.prepPilot.core.repository;

import com.prepPilot.core.model.CodingProblem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CodingProblemRepository extends JpaRepository<CodingProblem, UUID> {

    @EntityGraph(attributePaths = "testCases")
    Optional<CodingProblem> findWithTestCasesById(UUID id);

    long countByTopicId(UUID topicId);
}