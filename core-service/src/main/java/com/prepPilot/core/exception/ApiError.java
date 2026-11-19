package com.prepPilot.core.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        String timestamp,
        int status,
        String error,
        String message,
        String path,
        List<FieldDetail> details
) {
    public record FieldDetail(String field, String message) {}

    public static ApiError of(HttpStatus status, String message, String path,
                              List<FieldDetail> details) {
        return new ApiError(Instant.now().toString(), status.value(),
                status.name(), message, path, details);
    }
}