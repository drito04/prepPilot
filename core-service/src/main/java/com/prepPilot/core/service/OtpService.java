package com.prepPilot.core.service;

import com.prepPilot.core.exception.ApiException;
import com.prepPilot.core.model.OtpCode;
import com.prepPilot.core.model.OtpPurpose;
import com.prepPilot.core.model.User;
import com.prepPilot.core.repository.OtpCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpCodeRepository otpCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom random = new SecureRandom();

    @Value("${app.otp.ttl-minutes}")
    private long ttlMinutes;
    @Value("${app.otp.max-attempts}")
    private int maxAttempts;
    @Value("${app.otp.resend-cooldown-seconds}")
    private long cooldownSeconds;
    @Value("${app.otp.max-sends-per-hour}")
    private int maxSendsPerHour;

    /** Throws 429 if a code was sent too recently or too many were sent this hour. */
    @Transactional(readOnly = true)
    public void checkCanIssue(UUID userId, OtpPurpose purpose) {
        Instant now = Instant.now();

        otpCodeRepository.findTopByUserIdAndPurposeOrderByCreatedAtDesc(userId, purpose)
                .ifPresent(last -> {
                    if (last.getCreatedAt().plusSeconds(cooldownSeconds).isAfter(now)) {
                        throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                                "Please wait before requesting another code");
                    }
                });

        long sentLastHour = otpCodeRepository.countByUserIdAndPurposeAndCreatedAtAfter(
                userId, purpose, now.minus(1, ChronoUnit.HOURS));
        if (sentLastHour >= maxSendsPerHour) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many codes requested. Try again later");
        }
    }

    /** Creates a new code, invalidates any earlier active one, and returns the raw code to email. */
    @Transactional
    public String issue(User user, OtpPurpose purpose) {
        checkCanIssue(user.getId(), purpose);

        Instant now = Instant.now();
        otpCodeRepository.invalidateActive(user.getId(), purpose, now);

        String code = String.format("%06d", random.nextInt(1_000_000));

        OtpCode otp = new OtpCode();
        otp.setUserId(user.getId());
        otp.setPurpose(purpose);
        otp.setCodeHash(passwordEncoder.encode(code));
        otp.setExpiresAt(now.plus(ttlMinutes, ChronoUnit.MINUTES));
        otpCodeRepository.save(otp);

        return code;
    }

    /**
     * Returns normally only if the code is right. A wrong guess must still be saved,
     * so a failed check does NOT roll back the transaction (noRollbackFor).
     */
    @Transactional(noRollbackFor = ApiException.class)
    public void verify(User user, OtpPurpose purpose, String code) {
        OtpCode otp = otpCodeRepository
                .findTopByUserIdAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(user.getId(), purpose)
                .orElseThrow(this::invalid);

        Instant now = Instant.now();
        if (otp.getExpiresAt().isBefore(now)) {
            throw invalid();
        }
        if (otp.getAttempts() >= maxAttempts) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Too many incorrect attempts. Request a new code");
        }
        if (!passwordEncoder.matches(code, otp.getCodeHash())) {
            otp.setAttempts(otp.getAttempts() + 1);
            otpCodeRepository.save(otp);
            throw invalid();
        }

        otp.setConsumedAt(now);
        otpCodeRepository.save(otp);
    }

    private ApiException invalid() {
        return new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired code");
    }
}