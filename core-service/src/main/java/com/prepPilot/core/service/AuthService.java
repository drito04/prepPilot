package com.prepPilot.core.service;

import com.prepPilot.core.dto.EmailRequest;
import com.prepPilot.core.dto.LoginRequest;
import com.prepPilot.core.dto.LoginResponse;
import com.prepPilot.core.dto.MessageResponse;
import com.prepPilot.core.dto.RegisterRequest;
import com.prepPilot.core.dto.ResetPasswordRequest;
import com.prepPilot.core.dto.UserResponse;
import com.prepPilot.core.dto.VerifyEmailRequest;
import com.prepPilot.core.exception.ApiException;
import com.prepPilot.core.model.OtpPurpose;
import com.prepPilot.core.model.User;
import com.prepPilot.core.repository.UserRepository;
import com.prepPilot.core.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserService userService;
    private final OtpService otpService;
    private final MailService mailService;

    // ---- registration with email verification (not @Transactional, see note above) ----

    public MessageResponse register(RegisterRequest request) {
        // Don't touch an existing unverified account while its last code is still cooling down.
        userRepository.findByEmailIgnoreCase(normalize(request.email()))
                .filter(u -> !u.isEmailVerified())
                .ifPresent(u -> otpService.checkCanIssue(u.getId(), OtpPurpose.EMAIL_VERIFICATION));

        User user = userService.registerStudent(
                request.fullName(), request.email(), request.password());
        sendCode(user, OtpPurpose.EMAIL_VERIFICATION);
        return new MessageResponse("Verification code sent to your email");
    }

    public LoginResponse verifyEmail(VerifyEmailRequest request) {
        User user = findForOtp(request.email());
        otpService.verify(user, OtpPurpose.EMAIL_VERIFICATION, request.otp());
        return issueLogin(userService.markEmailVerified(user.getId()));
    }

    public MessageResponse resendVerification(EmailRequest request) {
        userRepository.findByEmailIgnoreCase(normalize(request.email()))
                .filter(u -> !u.isEmailVerified())
                .ifPresent(u -> trySend(u, OtpPurpose.EMAIL_VERIFICATION));
        return new MessageResponse("If that account needs verification, a new code has been sent");
    }

    // ---- password reset ----

    public MessageResponse forgotPassword(EmailRequest request) {
        userRepository.findByEmailIgnoreCase(normalize(request.email()))
                .filter(u -> u.isEnabled() && u.isEmailVerified())
                .ifPresent(u -> trySend(u, OtpPurpose.PASSWORD_RESET));
        return new MessageResponse("If that email is registered, a reset code has been sent");
    }

    public MessageResponse resetPassword(ResetPasswordRequest request) {
        User user = findForOtp(request.email());
        otpService.verify(user, OtpPurpose.PASSWORD_RESET, request.otp());
        userService.changePassword(user.getId(), request.newPassword());
        return new MessageResponse("Password updated. You can now log in.");
    }

    // ---- login and current user ----

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String email = normalize(request.email());

        // Same message for unknown email and wrong password, so attackers can't tell which emails exist.
        User user = userRepository.findByEmailIgnoreCase(email)
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!user.isEnabled()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Account is disabled");
        }
        // Only reached with the correct password, so this doesn't reveal anything to a guesser.
        if (!user.isEmailVerified()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Email not verified");
        }
        return issueLogin(user);
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .filter(User::isEnabled)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User no longer exists"));
        return UserResponse.from(user);
    }

    // ---- helpers ----

    private LoginResponse issueLogin(User user) {
        String token = jwtService.generateToken(user);
        return new LoginResponse(token, "Bearer", jwtService.getExpirySeconds(), UserResponse.from(user));
    }

    private void sendCode(User user, OtpPurpose purpose) {
        String code = otpService.issue(user, purpose);
        mailService.sendOtp(user.getEmail(), code, purpose);
    }

    /** For endpoints that must not reveal whether an email exists: failures are logged, not returned. */
    private void trySend(User user, OtpPurpose purpose) {
        try {
            sendCode(user, purpose);
        } catch (ApiException e) {
            log.warn("{} code not sent for user {}: {}", purpose, user.getId(), e.getMessage());
        }
    }

    private User findForOtp(String email) {
        return userRepository.findByEmailIgnoreCase(normalize(email))
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired code"));
    }

    private String normalize(String email) {
        return email.trim().toLowerCase();
    }
}