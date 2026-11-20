package com.prepPilot.core.service;

import com.prepPilot.core.exception.ApiException;
import com.prepPilot.core.model.Role;
import com.prepPilot.core.model.User;
import com.prepPilot.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /** Admin-created and seeded accounts are trusted, so they start verified. */
    @Transactional
    public User create(String fullName, String email, String rawPassword, Role role) {
        String normalizedEmail = normalize(email);
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw emailTaken();
        }
        return userRepository.saveAndFlush(build(fullName, normalizedEmail, rawPassword, role, true));
    }

    /**
     * Self-registration: always a STUDENT, unverified.
     * If the email belongs to an unverified account, that account is replaced, so nobody
     * can block an address by registering it and never verifying.
     */
    @Transactional
    public User registerStudent(String fullName, String email, String rawPassword) {
        String normalizedEmail = normalize(email);
        Optional<User> existing = userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (existing.isPresent()) {
            User user = existing.get();
            if (user.isEmailVerified()) {
                throw emailTaken();
            }
            user.setFullName(fullName.trim());
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            return userRepository.saveAndFlush(user);
        }

        return userRepository.saveAndFlush(
                build(fullName, normalizedEmail, rawPassword, Role.STUDENT, false));
    }

    @Transactional
    public User markEmailVerified(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired code"));
        user.setEmailVerified(true);
        return userRepository.saveAndFlush(user);
    }

    @Transactional
    public void changePassword(UUID userId, String rawPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired code"));
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        userRepository.saveAndFlush(user);
    }

    private User build(String fullName, String normalizedEmail, String rawPassword,
                       Role role, boolean verified) {
        User user = new User();
        user.setEmail(normalizedEmail);
        user.setFullName(fullName.trim());
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setEmailVerified(verified);
        return user;
    }

    private String normalize(String email) {
        return email.trim().toLowerCase();
    }

    private ApiException emailTaken() {
        return new ApiException(HttpStatus.CONFLICT, "Email is already registered");
    }
}