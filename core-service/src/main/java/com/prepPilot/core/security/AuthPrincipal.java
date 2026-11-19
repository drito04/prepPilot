package com.prepPilot.core.security;

import com.prepPilot.core.model.Role;

import java.util.UUID;

public record AuthPrincipal(UUID userId, Role role) {}