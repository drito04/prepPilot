package com.prepPilot.core.dto;

import com.prepPilot.core.model.Difficulty;
import com.prepPilot.core.model.Question;
import com.prepPilot.core.model.QuestionOption;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * What a student sees while answering. There is deliberately no field for the correct option
 * or the explanation, so they cannot leak. Reviews after the exam closes (FR-E7) will use a
 * separate view in Phase 2.
 */
public record StudentQuestionView(
        UUID id,
        UUID topicId,
        String statement,
        Difficulty difficulty,
        List<OptionView> options
) {
    public record OptionView(UUID id, int sortOrder, String body) {}

    public static StudentQuestionView from(Question question) {
        List<OptionView> options = question.getOptions().stream()
                .sorted(Comparator.comparingInt(QuestionOption::getSortOrder))
                .map(o -> new OptionView(o.getId(), o.getSortOrder(), o.getBody()))
                .toList();
        return new StudentQuestionView(question.getId(), question.getTopicId(),
                question.getStatement(), question.getDifficulty(), options);
    }
}