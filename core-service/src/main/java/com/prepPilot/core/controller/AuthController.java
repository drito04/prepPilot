package com.prepPilot.core.controller;

import com.prepPilot.core.dto.EmailRequest;
import com.prepPilot.core.dto.LoginRequest;
import com.prepPilot.core.dto.LoginResponse;
import com.prepPilot.core.dto.MessageResponse;
import com.prepPilot.core.dto.RegisterRequest;
import com.prepPilot.core.dto.ResetPasswordRequest;
import com.prepPilot.core.dto.VerifyEmailRequest;
import com.prepPilot.core.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Auth", description = "Public endpoints: registration, verification, login, password reset")
@SecurityRequirements
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Register a student (emails a verification code)")
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @Operation(summary = "Verify the emailed code and log in")
    @PostMapping("/verify-email")
    public LoginResponse verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return authService.verifyEmail(request);
    }

    @Operation(summary = "Send a new verification code")
    @PostMapping("/resend-verification")
    public MessageResponse resendVerification(@Valid @RequestBody EmailRequest request) {
        return authService.resendVerification(request);
    }

    @Operation(summary = "Log in with email and password")
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @Operation(summary = "Send a password reset code")
    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@Valid @RequestBody EmailRequest request) {
        return authService.forgotPassword(request);
    }

    @Operation(summary = "Reset the password with the emailed code")
    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return authService.resetPassword(request);
    }
}