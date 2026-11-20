package com.prepPilot.core.service;

import com.prepPilot.core.exception.ApiException;
import com.prepPilot.core.model.OtpPurpose;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;

    @Value("${app.otp.ttl-minutes}")
    private long ttlMinutes;

    public void sendOtp(String to, String code, OtpPurpose purpose) {
        boolean verification = purpose == OtpPurpose.EMAIL_VERIFICATION;
        String subject = verification ? "Verify your prepPilot account" : "Reset your prepPilot password";
        String action = verification ? "verify your email address" : "reset your password";

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText("Your prepPilot code to " + action + " is:\n\n"
                + code + "\n\n"
                + "It expires in " + ttlMinutes + " minutes. "
                + "If you did not request this, you can ignore this email.");

        try {
            mailSender.send(message);
        } catch (MailException e) {
            log.error("Failed to send {} email to {}", purpose, to, e);
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not send email right now. Please try again.");
        }
    }
}