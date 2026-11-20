package com.prepPilot.core.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProfileRequest(
        @Size(max = 80, message = "must be at most 80 characters")
        String branch,

        @Min(value = 2000, message = "must be 2000 or later")
        @Max(value = 2100, message = "must be 2100 or earlier")
        Integer graduationYear,

        @DecimalMin(value = "0.0", message = "must be between 0 and 10")
        @DecimalMax(value = "10.0", message = "must be between 0 and 10")
        @Digits(integer = 2, fraction = 2, message = "must have at most 2 decimal places")
        BigDecimal cgpa,

        @Pattern(regexp = "SERVICE|PRODUCT|STARTUP|ANALYST",
                message = "must be one of SERVICE, PRODUCT, STARTUP, ANALYST")
        String targetCompanyType
) {}