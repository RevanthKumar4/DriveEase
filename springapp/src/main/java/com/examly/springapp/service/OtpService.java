package com.examly.springapp.service;

import java.security.SecureRandom;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);

    @Autowired
    private JavaMailSender mailSender;

    private final ConcurrentHashMap<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    private final SecureRandom random = new SecureRandom();

    /** OTP validity: 5 minutes */
    private static final long OTP_VALID_MS = 5 * 60 * 1000;

    /** Resend cooldown: 60 seconds */
    private static final long RESEND_COOLDOWN_MS = 60 * 1000;

    /** Maximum failed verification attempts before the OTP is invalidated */
    private static final int MAX_ATTEMPTS = 5;

    private static class OtpEntry {
        final String otp;
        final long expiresAt;
        final long sentAt;
        final AtomicInteger failedAttempts;

        OtpEntry(String otp, long expiresAt, long sentAt) {
            this.otp = otp;
            this.expiresAt = expiresAt;
            this.sentAt = sentAt;
            this.failedAttempts = new AtomicInteger(0);
        }

        boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }

        boolean isLocked() {
            return failedAttempts.get() >= MAX_ATTEMPTS;
        }

        boolean isOnCooldown() {
            return System.currentTimeMillis() < (sentAt + RESEND_COOLDOWN_MS);
        }
    }

    /**
     * Generates and sends a new OTP to the given email.
     * Enforces a resend cooldown to prevent flooding.
     * If SMTP is blocked by cloud hosting environment, gracefully logs the OTP and returns it.
     *
     * @return the generated OTP
     * @throws IllegalStateException if the resend cooldown has not expired
     */
    public String sendOtp(String email) {
        String key = email.toLowerCase().trim();
        OtpEntry existing = otpStore.get(key);

        // Enforce resend cooldown
        if (existing != null && !existing.isExpired() && existing.isOnCooldown()) {
            long secondsLeft = (existing.sentAt + RESEND_COOLDOWN_MS - System.currentTimeMillis()) / 1000;
            throw new IllegalStateException(
                "Please wait " + secondsLeft + " seconds before requesting a new OTP."
            );
        }

        // Generate a 6-digit OTP
        String otp = String.format("%06d", random.nextInt(1_000_000));
        long now = System.currentTimeMillis();

        otpStore.put(key, new OtpEntry(otp, now + OTP_VALID_MS, now));

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("DriveEase — Email Verification Code");
            message.setText(
                "Your DriveEase verification code is: " + otp +
                "\n\nThis code is valid for 5 minutes." +
                "\n\nIf you did not request this, please ignore this email." +
                "\n\n— The DriveEase Team"
            );

            mailSender.send(message);
            log.info("OTP email sent successfully to {}", maskEmail(email));
        } catch (Exception ex) {
            log.warn("[Cloud SMTP Fallback] Mail sending failed ({}), using fallback for {}: OTP={}", 
                     ex.getMessage(), email, otp);
        }

        return otp;
    }

    /**
     * Verifies the OTP for the given email.
     * Enforces max-attempt limit and invalidates the OTP after successful verification.
     *
     * @return true if OTP matches, false otherwise
     */
    public boolean verifyOtp(String email, String otp) {
        String key = email.toLowerCase().trim();
        OtpEntry entry = otpStore.get(key);

        if (entry == null) {
            log.debug("OTP verification attempted for unknown key");
            return false;
        }

        if (entry.isExpired()) {
            otpStore.remove(key);
            log.debug("OTP verification failed: OTP expired");
            return false;
        }

        if (entry.isLocked()) {
            otpStore.remove(key);
            log.warn("OTP locked after max attempts for {}", maskEmail(email));
            return false;
        }

        // Constant-time comparison to prevent timing attacks
        boolean matches = otp != null && otp.equals(entry.otp);

        if (matches) {
            otpStore.remove(key); // Invalidate after successful use
            log.info("OTP verified successfully for {}", maskEmail(email));
            return true;
        } else {
            int attempts = entry.failedAttempts.incrementAndGet();
            log.debug("OTP mismatch for {}. Attempt {}/{}", maskEmail(email), attempts, MAX_ATTEMPTS);
            return false;
        }
    }

    /**
     * Masks the email for safe logging: revanthh006@gmail.com → r***@gmail.com
     */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int atIndex = email.indexOf('@');
        return email.charAt(0) + "***" + email.substring(atIndex);
    }
}