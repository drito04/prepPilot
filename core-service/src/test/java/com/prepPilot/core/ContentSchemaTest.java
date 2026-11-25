package com.prepPilot.core;

import com.prepPilot.core.model.CodingProblem;
import com.prepPilot.core.model.Difficulty;
import com.prepPilot.core.model.Question;
import com.prepPilot.core.model.QuestionOption;
import com.prepPilot.core.model.Role;
import com.prepPilot.core.model.TestCase;
import com.prepPilot.core.model.Topic;
import com.prepPilot.core.model.TopicCategory;
import com.prepPilot.core.model.User;
import com.prepPilot.core.repository.CodingProblemRepository;
import com.prepPilot.core.repository.QuestionRepository;
import com.prepPilot.core.repository.TopicRepository;
import com.prepPilot.core.service.UserService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Every test runs inside a transaction that is rolled back afterwards, so nothing leaks between tests.
 * Because a failed statement poisons a PostgreSQL transaction, each test ends with at most one failure.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ContentSchemaTest {

    @Autowired TopicRepository topicRepository;
    @Autowired QuestionRepository questionRepository;
    @Autowired CodingProblemRepository codingProblemRepository;
    @Autowired UserService userService;
    @Autowired JdbcTemplate jdbc;
    @PersistenceContext EntityManager entityManager;

    // ---------- helpers ----------

    private Topic savedTopic(TopicCategory category) {
        Topic topic = new Topic();
        topic.setName("Test topic " + UUID.randomUUID());
        topic.setCategory(category);
        return topicRepository.saveAndFlush(topic);
    }

    private static QuestionOption option(int sortOrder, String body, boolean correct) {
        QuestionOption option = new QuestionOption();
        option.setSortOrder(sortOrder);
        option.setBody(body);
        option.setCorrect(correct);
        return option;
    }

    private static Question question(UUID topicId) {
        Question question = new Question();
        question.setTopicId(topicId);
        question.setStatement("What is 2 + 2?");
        question.setDifficulty(Difficulty.EASY);
        question.addOption(option(1, "3", false));
        question.addOption(option(2, "4", true));
        question.addOption(option(3, "5", false));
        return question;
    }

    private static TestCase testCase(int sortOrder, String input, String output, boolean hidden) {
        TestCase testCase = new TestCase();
        testCase.setSortOrder(sortOrder);
        testCase.setInputData(input);
        testCase.setExpectedOutput(output);
        testCase.setHidden(hidden);
        return testCase;
    }

    private static CodingProblem problem(UUID topicId) {
        CodingProblem problem = new CodingProblem();
        problem.setTopicId(topicId);
        problem.setTitle("Add two numbers");
        problem.setStatement("Print a + b.");
        problem.setDifficulty(Difficulty.EASY);
        return problem;
    }

    // ---------- topics ----------

    @Test
    void starterTopicsExistInEveryCategory() {
        for (TopicCategory category : TopicCategory.values()) {
            assertThat(topicRepository.findAllByCategoryOrderByNameAsc(category))
                    .as("topics in category %s", category)
                    .isNotEmpty();
        }
    }

    @Test
    void topicNamesAreUniqueIgnoringCase() {
        Topic duplicate = new Topic();
        duplicate.setName("PERCENTAGES");   // the starter topic is "Percentages"
        duplicate.setCategory(TopicCategory.QUANT);

        assertThatThrownBy(() -> topicRepository.saveAndFlush(duplicate))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void aTopicThatStillHasQuestionsCannotBeDeleted() {
        Topic topic = savedTopic(TopicCategory.QUANT);
        questionRepository.saveAndFlush(question(topic.getId()));

        assertThatThrownBy(() -> {
            topicRepository.delete(topic);
            topicRepository.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    // ---------- MCQ questions ----------

    @Test
    void questionWithOptionsRoundTripsInDisplayOrder() {
        Topic topic = savedTopic(TopicCategory.QUANT);
        Question question = question(topic.getId());
        question.getOptions().clear();
        // Added out of order on purpose: ordering must come from sortOrder, not insertion.
        question.addOption(option(3, "5", false));
        question.addOption(option(1, "3", false));
        question.addOption(option(2, "4", true));
        UUID id = questionRepository.saveAndFlush(question).getId();
        entityManager.clear();

        Question loaded = questionRepository.findWithOptionsById(id).orElseThrow();

        assertThat(loaded.getOptions()).extracting(QuestionOption::getBody).containsExactly("3", "4", "5");
        assertThat(loaded.getOptions()).filteredOn(QuestionOption::isCorrect)
                .extracting(QuestionOption::getBody).containsExactly("4");
        assertThat(loaded.isActive()).isTrue();
        assertThat(loaded.getCreatedAt()).isNotNull();
    }

    @Test
    void aQuestionCannotHaveTwoCorrectOptions() {
        Topic topic = savedTopic(TopicCategory.QUANT);
        Question question = question(topic.getId());
        question.addOption(option(4, "6", true));

        assertThatThrownBy(() -> questionRepository.saveAndFlush(question))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void twoOptionsCannotShareADisplayPosition() {
        Topic topic = savedTopic(TopicCategory.QUANT);
        Question question = question(topic.getId());
        question.addOption(option(2, "duplicate position", false));

        assertThatThrownBy(() -> questionRepository.saveAndFlush(question))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void deletingAQuestionInTheDatabaseRemovesItsOptions() {
        Topic topic = savedTopic(TopicCategory.QUANT);
        UUID id = questionRepository.saveAndFlush(question(topic.getId())).getId();

        jdbc.update("DELETE FROM questions WHERE id = ?", id);   // bypasses Hibernate: tests the DB cascade

        Integer remaining = jdbc.queryForObject(
                "SELECT count(*) FROM question_options WHERE question_id = ?", Integer.class, id);
        assertThat(remaining).isZero();
    }

    @Test
    void aDifficultyOutsideTheAllowedValuesIsRejected() {
        Topic topic = savedTopic(TopicCategory.QUANT);

        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO questions (topic_id, statement, difficulty) VALUES (?, 'x', 'EXTREME')",
                topic.getId())).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void deletingTheAuthorKeepsTheQuestionAndClearsCreatedBy() {
        Topic topic = savedTopic(TopicCategory.QUANT);
        User author = userService.create("Author", "author-" + UUID.randomUUID() + "@test.com",
                "Passw0rd!x", Role.ADMIN);
        Question question = question(topic.getId());
        question.setCreatedBy(author.getId());
        UUID id = questionRepository.saveAndFlush(question).getId();

        jdbc.update("DELETE FROM app_users WHERE id = ?", author.getId());

        Integer questions = jdbc.queryForObject("SELECT count(*) FROM questions WHERE id = ?", Integer.class, id);
        UUID createdBy = jdbc.queryForObject("SELECT created_by FROM questions WHERE id = ?", UUID.class, id);
        assertThat(questions).isEqualTo(1);
        assertThat(createdBy).isNull();
    }

    // ---------- coding problems ----------

    @Test
    void codingProblemWithTestCasesRoundTripsWithDefaultLimits() {
        Topic topic = savedTopic(TopicCategory.CODING);
        CodingProblem problem = problem(topic.getId());
        problem.addTestCase(testCase(2, "2 3", "5", true));
        problem.addTestCase(testCase(1, "1 1", "2", false));
        UUID id = codingProblemRepository.saveAndFlush(problem).getId();
        entityManager.clear();

        CodingProblem loaded = codingProblemRepository.findWithTestCasesById(id).orElseThrow();

        assertThat(loaded.getTestCases()).extracting(TestCase::getInputData).containsExactly("1 1", "2 3");
        assertThat(loaded.getTestCases()).extracting(TestCase::isHidden).containsExactly(false, true);
        assertThat(loaded.getTimeLimitMs()).isEqualTo(2000);
        assertThat(loaded.getMemoryLimitMb()).isEqualTo(256);
    }

    @Test
    void aTestCaseInsertedWithoutAVisibilityFlagIsHiddenInTheDatabase() {
        Topic topic = savedTopic(TopicCategory.CODING);
        UUID problemId = codingProblemRepository.saveAndFlush(problem(topic.getId())).getId();

        jdbc.update("INSERT INTO test_cases (problem_id, sort_order, input_data, expected_output) "
                + "VALUES (?, 1, 'in', 'out')", problemId);

        Boolean hidden = jdbc.queryForObject(
                "SELECT is_hidden FROM test_cases WHERE problem_id = ?", Boolean.class, problemId);
        assertThat(hidden).isTrue();
    }

    @Test
    void twoTestCasesCannotShareAPosition() {
        Topic topic = savedTopic(TopicCategory.CODING);
        CodingProblem problem = problem(topic.getId());
        problem.addTestCase(testCase(1, "a", "b", false));
        problem.addTestCase(testCase(1, "c", "d", true));

        assertThatThrownBy(() -> codingProblemRepository.saveAndFlush(problem))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void aTimeLimitOutsideTheAllowedRangeIsRejected() {
        Topic topic = savedTopic(TopicCategory.CODING);

        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO coding_problems (topic_id, title, statement, difficulty, time_limit_ms) "
                        + "VALUES (?, 't', 's', 'EASY', 50)", topic.getId()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void deletingACodingProblemInTheDatabaseRemovesItsTestCases() {
        Topic topic = savedTopic(TopicCategory.CODING);
        CodingProblem problem = problem(topic.getId());
        problem.addTestCase(testCase(1, "a", "b", false));
        UUID id = codingProblemRepository.saveAndFlush(problem).getId();

        jdbc.update("DELETE FROM coding_problems WHERE id = ?", id);

        Integer remaining = jdbc.queryForObject(
                "SELECT count(*) FROM test_cases WHERE problem_id = ?", Integer.class, id);
        assertThat(remaining).isZero();
    }
}