package com.prepPilot.core.config;

import com.prepPilot.core.model.Role;
import com.prepPilot.core.repository.UserRepository;
import com.prepPilot.core.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final UserService userService;
    private final UserRepository userRepository;

    @Value("${app.seed.admin-email:}")
    private String adminEmail;
    @Value("${app.seed.admin-password:}")
    private String adminPassword;
    @Value("${app.seed.interviewer-email:}")
    private String interviewerEmail;
    @Value("${app.seed.interviewer-password:}")
    private String interviewerPassword;

    @Override
    public void run(ApplicationArguments args) {
        seed("ADMIN", "System Admin", adminEmail, adminPassword, Role.ADMIN);
        seed("INTERVIEWER", "Demo Interviewer", interviewerEmail, interviewerPassword, Role.INTERVIEWER);
    }

    private void seed(String label, String fullName, String email, String password, Role role) {
        if (email.isBlank() || password.isBlank()) {
            log.info("Seed {} skipped: email or password env var not set", label);
            return;
        }
        if (password.length() < 8) {
            log.warn("Seed {} skipped: password must be at least 8 characters", label);
            return;
        }
        if (userRepository.existsByEmailIgnoreCase(email.trim())) {
            log.info("Seed {} already exists: {}", label, email.trim().toLowerCase());
            return;
        }
        userService.create(fullName, email, password, role);
        log.info("Seeded {} account: {}", label, email.trim().toLowerCase());
    }
}