package com.prepPilot.core.controller;

import com.prepPilot.core.dto.ProfileRequest;
import com.prepPilot.core.dto.ProfileResponse;
import com.prepPilot.core.security.AuthPrincipal;
import com.prepPilot.core.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me/profile")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ProfileResponse get(@AuthenticationPrincipal AuthPrincipal principal) {
        return profileService.get(principal.userId());
    }

    @PutMapping
    public ProfileResponse update(@AuthenticationPrincipal AuthPrincipal principal,
                                  @Valid @RequestBody ProfileRequest request) {
        return profileService.update(principal.userId(), request);
    }
}