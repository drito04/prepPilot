package com.prepPilot.core.repository;

import com.prepPilot.core.model.OtpCode;
import com.prepPilot.core.model.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface OtpCodeRepository extends JpaRepository<OtpCode, UUID> {

    Optional<OtpCode> findTopByUserIdAndPurposeOrderByCreatedAtDesc(UUID userId, OtpPurpose purpose);

    Optional<OtpCode> findTopByUserIdAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
            UUID userId, OtpPurpose purpose);

    long countByUserIdAndPurposeAndCreatedAtAfter(UUID userId, OtpPurpose purpose, Instant after);

    @Modifying
    @Query("update OtpCode o set o.consumedAt = :now "
            + "where o.userId = :userId and o.purpose = :purpose and o.consumedAt is null")
    int invalidateActive(@Param("userId") UUID userId,
                         @Param("purpose") OtpPurpose purpose,
                         @Param("now") Instant now);
}