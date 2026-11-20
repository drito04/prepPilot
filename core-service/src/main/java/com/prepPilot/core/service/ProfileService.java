package com.prepPilot.core.service;

import com.prepPilot.core.dto.ProfileRequest;
import com.prepPilot.core.dto.ProfileResponse;
import com.prepPilot.core.exception.ApiException;
import com.prepPilot.core.model.StudentProfile;
import com.prepPilot.core.repository.StudentProfileRepository;
import com.prepPilot.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final StudentProfileRepository profileRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public ProfileResponse get(UUID userId) {
        return profileRepository.findById(userId)
                .map(ProfileResponse::from)
                .orElseGet(ProfileResponse::empty);
    }

    /** Replaces the whole profile: a field sent as null (or omitted) is cleared. */
    @Transactional
    public ProfileResponse update(UUID userId, ProfileRequest request) {
        if (!userRepository.existsById(userId)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "User no longer exists");
        }

        StudentProfile profile = profileRepository.findById(userId).orElseGet(() -> {
            StudentProfile created = new StudentProfile();
            created.setUserId(userId);
            return created;
        });

        profile.setBranch(blankToNull(request.branch()));
        profile.setGraduationYear(request.graduationYear());
        profile.setCgpa(request.cgpa());
        profile.setTargetCompanyType(request.targetCompanyType());

        return ProfileResponse.from(profileRepository.saveAndFlush(profile));
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}