package com.prepPilot.core.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record EmailRequest(
        @NotBlank(message = "must not be blank")
        @Email(message = "must be a valid email")
        String email
) {}