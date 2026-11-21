package com.prepPilot.core.security;

import com.prepPilot.core.model.Role;
import com.prepPilot.core.model.User;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "unit-test-secret-unit-test-secret-1234";

    private User user(Role role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setRole(role);
        return user;
    }

    @Test
    void tokenRoundTripKeepsUserIdAndRole() {
        JwtService service = new JwtService(SECRET, 3600);
        User user = user(Role.ADMIN);

        AuthPrincipal principal = service.parse(service.generateToken(user));

        assertThat(principal.userId()).isEqualTo(user.getId());
        assertThat(principal.role()).isEqualTo(Role.ADMIN);
    }

    @Test
    void tokenHeaderDeclaresHs256() {
        String token = new JwtService(SECRET, 3600).generateToken(user(Role.STUDENT));

        String header = new String(
                Base64.getUrlDecoder().decode(token.split("\\.")[0]), StandardCharsets.UTF_8);

        assertThat(header).contains("\"alg\":\"HS256\"");
    }

    @Test
    void expiredTokenIsRejected() {
        String expired = new JwtService(SECRET, -60).generateToken(user(Role.STUDENT));

        assertThatThrownBy(() -> new JwtService(SECRET, 3600).parse(expired))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    void tokenSignedWithAnotherSecretIsRejected() {
        String foreign = new JwtService("another-secret-another-secret-123456", 3600)
                .generateToken(user(Role.STUDENT));

        assertThatThrownBy(() -> new JwtService(SECRET, 3600).parse(foreign))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void secretShorterThan32CharactersIsRefused() {
        assertThatThrownBy(() -> new JwtService("short", 60))
                .isInstanceOf(IllegalStateException.class);
    }
}