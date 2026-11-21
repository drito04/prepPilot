package com.prepPilot.core.controller;

import com.prepPilot.core.dto.UserResponse;
import com.prepPilot.core.security.AuthPrincipal;
import com.prepPilot.core.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
@Tag(name = "Current user")
public class MeController {

    private final AuthService authService;

    @Operation(summary = "Get the logged-in user")
    @GetMapping
    public UserResponse me(@AuthenticationPrincipal AuthPrincipal principal) {
        return authService.currentUser(principal.userId());
    }
}