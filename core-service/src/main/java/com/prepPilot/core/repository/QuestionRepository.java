package com.prepPilot.core.repository;

import com.prepPilot.core.model.Question;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface QuestionRepository extends JpaRepository<Question, UUID> {

    /** Loads the question and its options in one query (open-in-view is off, so lazy loading outside a transaction fails). */
    @EntityGraph(attributePaths = "options")
    Optional<Question> findWithOptionsById(UUID id);

    long countByTopicId(UUID topicId);
}