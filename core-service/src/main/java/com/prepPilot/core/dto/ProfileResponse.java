package com.prepPilot.core.dto;

import com.prepPilot.core.model.StudentProfile;

import java.math.BigDecimal;
import java.time.Instant;

public record ProfileResponse(
        String branch,
        Integer graduationYear,
        BigDecimal cgpa,
        String targetCompanyType,
        Instant updatedAt
) {
    public static ProfileResponse from(StudentProfile p) {
        return new ProfileResponse(p.getBranch(), p.getGraduationYear(), p.getCgpa(),
                p.getTargetCompanyType(), p.getUpdatedAt());
    }

    public static ProfileResponse empty() {
        return new ProfileResponse(null, null, null, null, null);
    }
}