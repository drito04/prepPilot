package com.prepPilot.core.service;

import com.prepPilot.core.dto.RegisterRequest;
import com.prepPilot.core.dto.UserResponse;
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
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
        }

        User user = new User();
        user.setEmail(email);
        user.setFullName(request.fullName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.STUDENT);

        return UserResponse.from(userRepository.saveAndFlush(user));
    }
}