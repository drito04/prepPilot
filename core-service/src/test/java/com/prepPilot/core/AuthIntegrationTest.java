package com.prepPilot.core;

import com.jayway.jsonpath.JsonPath;
import com.prepPilot.core.model.OtpPurpose;
import com.prepPilot.core.model.Role;
import com.prepPilot.core.model.User;
import com.prepPilot.core.security.JwtService;
import com.prepPilot.core.service.MailService;
import com.prepPilot.core.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class AuthIntegrationTest {

    private static final String PASSWORD = "Passw0rd!x";
    private static final String AUTH = "Authorization";

    @Autowired WebApplicationContext context;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserService userService;

    @Value("${spring.datasource.url}") String dbUrl;
    @Value("${app.jwt.secret}") String jwtSecret;

    @MockitoBean MailService mailService;

    MockMvc mvc;

    @BeforeEach
    void setUp() {
        assertThat(dbUrl).as("tests must run against a *_test database").contains("_test");
        jdbc.execute("TRUNCATE TABLE otp_codes, student_profiles, app_users CASCADE");
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    // ---------- registration and email verification ----------

    @Test
    void registerReturnsOnlyAMessageAndLoginIsBlockedUntilVerified() throws Exception {
        post("/api/auth/register", registerJson("a1@test.com"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.accessToken").doesNotExist());

        post("/api/auth/login", loginJson("a1@test.com", PASSWORD))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Email not verified"));
    }

    @Test
    void verifyingWithTheEmailedCodeLogsTheUserIn() throws Exception {
        String token = registerAndVerify("a2@test.com");

        mvc.perform(get("/api/me").header(AUTH, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("a2@test.com"))
                .andExpect(jsonPath("$.role").value("STUDENT"));
    }

    @Test
    void aVerificationCodeCannotBeUsedTwice() throws Exception {
        registerAndVerify("a3@test.com");
        String code = captureCode("a3@test.com", OtpPurpose.EMAIL_VERIFICATION);

        post("/api/auth/verify-email", verifyJson("a3@test.com", code))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid or expired code"));
    }

    @Test
    void afterFiveWrongGuessesEvenTheCorrectCodeIsRejected() throws Exception {
        post("/api/auth/register", registerJson("a4@test.com")).andExpect(status().isCreated());
        String code = captureCode("a4@test.com", OtpPurpose.EMAIL_VERIFICATION);
        String wrong = code.equals("000000") ? "111111" : "000000";

        for (int i = 0; i < 5; i++) {
            post("/api/auth/verify-email", verifyJson("a4@test.com", wrong))
                    .andExpect(status().isBadRequest());
        }

        post("/api/auth/verify-email", verifyJson("a4@test.com", code))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Too many incorrect attempts. Request a new code"));
    }

    @Test
    void registeringAVerifiedEmailAgainReturns409() throws Exception {
        registerAndVerify("a5@test.com");

        post("/api/auth/register", registerJson("a5@test.com"))
                .andExpect(status().isConflict());
    }

    @Test
    void wrongPasswordAndUnknownEmailGiveTheSameMessage() throws Exception {
        registerAndVerify("a6@test.com");

        post("/api/auth/login", loginJson("a6@test.com", "Wrong-pass1"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
        post("/api/auth/login", loginJson("nobody@test.com", PASSWORD))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    // ---------- password reset ----------

    @Test
    void passwordResetChangesThePasswordAndTheCodeIsSingleUse() throws Exception {
        registerAndVerify("b1@test.com");

        post("/api/auth/forgot-password", emailJson("b1@test.com")).andExpect(status().isOk());
        String code = captureCode("b1@test.com", OtpPurpose.PASSWORD_RESET);
        String newPassword = "NewPassw0rd!y";

        post("/api/auth/reset-password", resetJson("b1@test.com", code, newPassword))
                .andExpect(status().isOk());

        post("/api/auth/login", loginJson("b1@test.com", PASSWORD))
                .andExpect(status().isUnauthorized());
        post("/api/auth/login", loginJson("b1@test.com", newPassword))
                .andExpect(status().isOk());
        post("/api/auth/reset-password", resetJson("b1@test.com", code, newPassword))
                .andExpect(status().isBadRequest());
    }

    @Test
    void forgotPasswordForAnUnknownEmailLooksIdenticalAndSendsNothing() throws Exception {
        registerAndVerify("b2@test.com");
        reset(mailService);

        String known = post("/api/auth/forgot-password", emailJson("b2@test.com"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        reset(mailService);
        String unknown = post("/api/auth/forgot-password", emailJson("nobody@test.com"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();

        assertThat(unknown).isEqualTo(known);
        verifyNoInteractions(mailService);
    }

    @Test
    void askingForTwoResetCodesWithinTheCooldownSendsOnlyOneEmail() throws Exception {
        registerAndVerify("b3@test.com");

        post("/api/auth/forgot-password", emailJson("b3@test.com")).andExpect(status().isOk());
        post("/api/auth/forgot-password", emailJson("b3@test.com")).andExpect(status().isOk());

        verify(mailService, times(1)).sendOtp(eq("b3@test.com"), anyString(), eq(OtpPurpose.PASSWORD_RESET));
    }

    // ---------- token handling ----------

    @Test
    void protectedEndpointsRejectMissingGarbageTamperedAndExpiredTokens() throws Exception {
        String token = registerAndVerify("c1@test.com");

        mvc.perform(get("/api/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentication required"));

        mvc.perform(get("/api/me").header(AUTH, "Bearer garbage"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid token"));

        String[] parts = token.split("\\.");
        String flipped = (parts[2].charAt(0) == 'A' ? "B" : "A") + parts[2].substring(1);
        mvc.perform(get("/api/me").header(AUTH, bearer(parts[0] + "." + parts[1] + "." + flipped)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid token"));

        User someone = new User();
        someone.setId(UUID.randomUUID());
        someone.setRole(Role.STUDENT);
        String expired = new JwtService(jwtSecret, -60).generateToken(someone);
        mvc.perform(get("/api/me").header(AUTH, bearer(expired)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Token expired"));
    }

    // ---------- roles ----------

    @Test
    void rolesControlWhoCanReachProfileAndAdminEndpoints() throws Exception {
        String studentToken = registerAndVerify("d1@test.com");
        userService.create("Admin", "admin@test.com", PASSWORD, Role.ADMIN);
        String adminToken = login("admin@test.com", PASSWORD);
        String newUserJson = """
                {"fullName":"Made By Admin","email":"interviewer1@test.com","password":"%s","role":"INTERVIEWER"}"""
                .formatted(PASSWORD);

        // student: profile yes, admin endpoint no
        mvc.perform(get("/api/me/profile").header(AUTH, bearer(studentToken)))
                .andExpect(status().isOk());
        mvc.perform(adminCreate(newUserJson, studentToken)).andExpect(status().isForbidden());

        // admin: profile no, admin endpoint yes
        mvc.perform(get("/api/me/profile").header(AUTH, bearer(adminToken)))
                .andExpect(status().isForbidden());
        mvc.perform(adminCreate(newUserJson, adminToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("INTERVIEWER"));

        // no token at all
        mvc.perform(adminCreate(newUserJson, null)).andExpect(status().isUnauthorized());

        // the admin-created account is already verified and can log in
        post("/api/auth/login", loginJson("interviewer1@test.com", PASSWORD))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("INTERVIEWER"));
    }

    // ---------- student profile ----------

    @Test
    void studentProfileValidatesInputAndStoresValidValues() throws Exception {
        String token = registerAndVerify("e1@test.com");

        mvc.perform(get("/api/me/profile").header(AUTH, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cgpa").doesNotExist());

        mvc.perform(put("/api/me/profile").header(AUTH, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"graduationYear":1990,"cgpa":11,"targetCompanyType":"XYZ"}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.length()").value(3));

        mvc.perform(put("/api/me/profile").header(AUTH, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"branch":"CSE (AI & ML)","graduationYear":2026,"cgpa":8.5,"targetCompanyType":"PRODUCT"}"""))
                .andExpect(status().isOk());

        mvc.perform(get("/api/me/profile").header(AUTH, bearer(token)))
                .andExpect(jsonPath("$.branch").value("CSE (AI & ML)"))
                .andExpect(jsonPath("$.targetCompanyType").value("PRODUCT"));
    }

    // ---------- helpers ----------

    private ResultActions post(String path, String json) throws Exception {
        return mvc.perform(MockMvcRequestBuilders.post(path)
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private org.springframework.test.web.servlet.RequestBuilder adminCreate(String json, String token) {
        var builder = MockMvcRequestBuilders.post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON).content(json);
        return token == null ? builder : builder.header(AUTH, bearer(token));
    }

    private String registerAndVerify(String email) throws Exception {
        post("/api/auth/register", registerJson(email)).andExpect(status().isCreated());
        String code = captureCode(email, OtpPurpose.EMAIL_VERIFICATION);
        String body = post("/api/auth/verify-email", verifyJson(email, code))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.accessToken");
    }

    private String login(String email, String password) throws Exception {
        String body = post("/api/auth/login", loginJson(email, password))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.accessToken");
    }

    /** The mocked MailService never sends anything, so we read the code from the call it received. */
    private String captureCode(String email, OtpPurpose purpose) {
        ArgumentCaptor<String> code = ArgumentCaptor.forClass(String.class);
        verify(mailService, atLeastOnce()).sendOtp(eq(email), code.capture(), eq(purpose));
        return code.getValue();
    }

    private String bearer(String token) { return "Bearer " + token; }

    private String registerJson(String email) {
        return """
                {"fullName":"Test User","email":"%s","password":"%s"}""".formatted(email, PASSWORD);
    }
    private String loginJson(String email, String password) {
        return """
                {"email":"%s","password":"%s"}""".formatted(email, password);
    }
    private String verifyJson(String email, String otp) {
        return """
                {"email":"%s","otp":"%s"}""".formatted(email, otp);
    }
    private String emailJson(String email) {
        return """
                {"email":"%s"}""".formatted(email);
    }
    private String resetJson(String email, String otp, String newPassword) {
        return """
                {"email":"%s","otp":"%s","newPassword":"%s"}""".formatted(email, otp, newPassword);
    }
}