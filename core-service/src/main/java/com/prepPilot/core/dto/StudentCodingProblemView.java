package com.prepPilot.core.dto;

import com.prepPilot.core.model.CodingProblem;
import com.prepPilot.core.model.Difficulty;
import com.prepPilot.core.model.TestCase;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * What a student sees for a coding problem (FR-Q5). Visible sample cases are included in full.
 * Hidden cases appear only as a count: their input and expected output do not exist in this type.
 */
public record StudentCodingProblemView(
        UUID id,
        String title,
        String statement,
        String constraints,
        Difficulty difficulty,
        int timeLimitMs,
        int memoryLimitMb,
        List<SampleTestCase> samples,
        int hiddenTestCaseCount
) {
    public record SampleTestCase(int sortOrder, String input, String expectedOutput) {}

    public static StudentCodingProblemView from(CodingProblem problem) {
        List<SampleTestCase> samples = problem.getTestCases().stream()
                .filter(t -> !t.isHidden())
                .sorted(Comparator.comparingInt(TestCase::getSortOrder))
                .map(t -> new SampleTestCase(t.getSortOrder(), t.getInputData(), t.getExpectedOutput()))
                .toList();
        int hiddenCount = (int) problem.getTestCases().stream().filter(TestCase::isHidden).count();

        return new StudentCodingProblemView(problem.getId(), problem.getTitle(), problem.getStatement(),
                problem.getConstraintsText(), problem.getDifficulty(), problem.getTimeLimitMs(),
                problem.getMemoryLimitMb(), samples, hiddenCount);
    }
}