package com.prepPilot.core.dto;

import com.prepPilot.core.model.CodingProblem;
import com.prepPilot.core.model.Difficulty;
import com.prepPilot.core.model.Question;
import com.prepPilot.core.model.QuestionOption;
import com.prepPilot.core.model.TestCase;
import org.junit.jupiter.api.Test;

import java.lang.reflect.RecordComponent;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class StudentViewsTest {

    private static final String SECRET_EXPLANATION = "SECRET-EXPLANATION";

    private static List<String> componentNames(Class<?> recordType) {
        return Arrays.stream(recordType.getRecordComponents()).map(RecordComponent::getName).toList();
    }

    private static QuestionOption option(int sortOrder, String body, boolean correct) {
        QuestionOption option = new QuestionOption();
        option.setId(UUID.randomUUID());
        option.setSortOrder(sortOrder);
        option.setBody(body);
        option.setCorrect(correct);
        return option;
    }

    private static Question question() {
        Question question = new Question();
        question.setId(UUID.randomUUID());
        question.setTopicId(UUID.randomUUID());
        question.setStatement("What is 2 + 2?");
        question.setDifficulty(Difficulty.EASY);
        question.setExplanation(SECRET_EXPLANATION);
        question.addOption(option(2, "4", true));
        question.addOption(option(1, "3", false));
        question.addOption(option(3, "5", false));
        return question;
    }

    private static TestCase testCase(int sortOrder, String input, String output, boolean hidden) {
        TestCase testCase = new TestCase();
        testCase.setId(UUID.randomUUID());
        testCase.setSortOrder(sortOrder);
        testCase.setInputData(input);
        testCase.setExpectedOutput(output);
        testCase.setHidden(hidden);
        return testCase;
    }

    private static CodingProblem problem(TestCase... cases) {
        CodingProblem problem = new CodingProblem();
        problem.setId(UUID.randomUUID());
        problem.setTitle("Add two numbers");
        problem.setStatement("Print a + b.");
        problem.setDifficulty(Difficulty.EASY);
        Arrays.stream(cases).forEach(problem::addTestCase);
        return problem;
    }

    @Test
    void questionOptionsAreListedInDisplayOrder() {
        StudentQuestionView view = StudentQuestionView.from(question());

        assertThat(view.options()).extracting(StudentQuestionView.OptionView::body)
                .containsExactly("3", "4", "5");
    }

    @Test
    void questionViewExposesNoCorrectAnswerDataOrExplanation() {
        StudentQuestionView view = StudentQuestionView.from(question());

        assertThat(view.toString()).doesNotContain(SECRET_EXPLANATION);
        // Structure guard: adding a field here later must be a deliberate, reviewed change.
        assertThat(componentNames(StudentQuestionView.class))
                .containsExactly("id", "topicId", "statement", "difficulty", "options");
        assertThat(componentNames(StudentQuestionView.OptionView.class))
                .containsExactly("id", "sortOrder", "body");
    }

    @Test
    void codingViewIncludesOnlyVisibleSamplesAndCountsTheHiddenOnes() {
        CodingProblem problem = problem(
                testCase(1, "1 1", "2", false),
                testCase(2, "HIDDEN-INPUT-1", "HIDDEN-OUTPUT-1", true),
                testCase(3, "HIDDEN-INPUT-2", "HIDDEN-OUTPUT-2", true));

        StudentCodingProblemView view = StudentCodingProblemView.from(problem);

        assertThat(view.samples()).hasSize(1);
        assertThat(view.samples().get(0).input()).isEqualTo("1 1");
        assertThat(view.samples().get(0).expectedOutput()).isEqualTo("2");
        assertThat(view.hiddenTestCaseCount()).isEqualTo(2);
    }

    @Test
    void codingViewNeverCarriesHiddenInputOrOutput() {
        CodingProblem problem = problem(
                testCase(1, "1 1", "2", false),
                testCase(2, "HIDDEN-INPUT-1", "HIDDEN-OUTPUT-1", true));

        String rendered = StudentCodingProblemView.from(problem).toString();

        assertThat(rendered).doesNotContain("HIDDEN-INPUT-1").doesNotContain("HIDDEN-OUTPUT-1");
    }

    @Test
    void codingViewStructureStaysFree_OfHiddenData() {
        assertThat(componentNames(StudentCodingProblemView.class)).containsExactly(
                "id", "title", "statement", "constraints", "difficulty",
                "timeLimitMs", "memoryLimitMb", "samples", "hiddenTestCaseCount");
        assertThat(componentNames(StudentCodingProblemView.SampleTestCase.class))
                .containsExactly("sortOrder", "input", "expectedOutput");
    }

    @Test
    void aNewTestCaseIsHiddenByDefault() {
        assertThat(new TestCase().isHidden()).isTrue();
    }

    @Test
    void aProblemWhoseCasesAreAllHiddenShowsNoSamples() {
        CodingProblem problem = problem(testCase(1, "a", "b", true), testCase(2, "c", "d", true));

        StudentCodingProblemView view = StudentCodingProblemView.from(problem);

        assertThat(view.samples()).isEmpty();
        assertThat(view.hiddenTestCaseCount()).isEqualTo(2);
    }
}