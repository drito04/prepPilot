package com.prepPilot.core.security;

import com.prepPilot.core.model.Role;
import com.prepPilot.core.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirySeconds;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiry-seconds}") long expirySeconds) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);   // raw UTF-8, never base64-decoded
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 characters");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.expirySeconds = expirySeconds;
    }

    public long getExpirySeconds() {
        return expirySeconds;
    }

    public String generateToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .header().type("JWT").and()
                .subject(user.getId().toString())
                .claim("role", user.getRole().name())          // STUDENT / INTERVIEWER / ADMIN, no ROLE_ prefix
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(expirySeconds)))
                .signWith(key, Jwts.SIG.HS256)                 // explicit, see note above
                .compact();
    }

    /** Verifies signature, expiry and algorithm. Throws JwtException on any problem. */
    public AuthPrincipal parse(String token) {
        Jws<Claims> jws = Jwts.parser().verifyWith(key).build().parseSignedClaims(token);

        if (!Jwts.SIG.HS256.getId().equals(jws.getHeader().getAlgorithm())) {
            throw new JwtException("Unexpected signing algorithm");
        }

        Claims claims = jws.getPayload();
        String subject = claims.getSubject();
        String role = claims.get("role", String.class);
        if (subject == null || role == null) {
            throw new JwtException("Missing required claims");
        }
        return new AuthPrincipal(UUID.fromString(subject), Role.valueOf(role));
    }
}