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

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User create(String fullName, String email, String rawPassword, Role role) {
        String normalizedEmail = email.trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
        }

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setFullName(fullName.trim());
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole(role);

        return userRepository.saveAndFlush(user);
    }
}