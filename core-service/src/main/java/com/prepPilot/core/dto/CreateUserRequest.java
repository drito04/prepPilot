package com.prepPilot.core.dto;

import com.prepPilot.core.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank(message = "must not be blank")
        @Size(max = 120, message = "must be at most 120 characters")
        String fullName,

        @NotBlank(message = "must not be blank")
        @Email(message = "must be a valid email")
        @Size(max = 255, message = "must be at most 255 characters")
        String email,

        @NotBlank(message = "must not be blank")
        @Size(min = 8, max = 72, message = "must be between 8 and 72 characters")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
                message = "must contain at least one letter and one digit")
        String password,

        @NotNull(message = "must not be null")
        Role role
) {}