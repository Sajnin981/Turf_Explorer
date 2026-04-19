package com.turfexplorer.service;

import com.turfexplorer.exception.TooManyRequestsException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthRateLimiterService {

    private static final class CounterWindow {
        private final long windowStartMillis;
        private final int count;

        private CounterWindow(long windowStartMillis, int count) {
            this.windowStartMillis = windowStartMillis;
            this.count = count;
        }
    }

    private final Map<String, CounterWindow> counters = new ConcurrentHashMap<>();

    @Value("${auth.rate-limit.login.per-ip:20}")
    private int loginPerIp;

    @Value("${auth.rate-limit.login.per-email:10}")
    private int loginPerEmail;

    @Value("${auth.rate-limit.login.window-seconds:60}")
    private long loginWindowSeconds;

    @Value("${auth.rate-limit.register.per-ip:10}")
    private int registerPerIp;

    @Value("${auth.rate-limit.register.per-email:3}")
    private int registerPerEmail;

    @Value("${auth.rate-limit.register.window-seconds:900}")
    private long registerWindowSeconds;

    @Value("${auth.rate-limit.verify-otp.per-ip:30}")
    private int verifyOtpPerIp;

    @Value("${auth.rate-limit.verify-otp.per-email:6}")
    private int verifyOtpPerEmail;

    @Value("${auth.rate-limit.verify-otp.window-seconds:600}")
    private long verifyOtpWindowSeconds;

    @Value("${auth.rate-limit.max-entries:20000}")
    private int maxEntries;

    public void assertLoginAllowed(String clientId, String email) {
        String normalizedEmail = normalizeEmail(email);
        enforce(
                "auth:login:ip:" + normalizeKey(clientId),
                loginPerIp,
                loginWindowSeconds,
                "Too many login attempts from this IP. Please wait and try again."
        );
        enforce(
                "auth:login:email:" + normalizedEmail,
                loginPerEmail,
                loginWindowSeconds,
                "Too many login attempts for this account. Please wait and try again."
        );
    }

    public void assertRegisterAllowed(String clientId, String email) {
        String normalizedEmail = normalizeEmail(email);
        enforce(
                "auth:register:ip:" + normalizeKey(clientId),
                registerPerIp,
                registerWindowSeconds,
                "Too many registration attempts from this IP. Please try again later."
        );
        enforce(
                "auth:register:email:" + normalizedEmail,
                registerPerEmail,
                registerWindowSeconds,
                "Too many registration attempts for this email. Please try again later."
        );
    }

    public void assertVerifyOtpAllowed(String clientId, String email) {
        String normalizedEmail = normalizeEmail(email);
        enforce(
                "auth:verify-otp:ip:" + normalizeKey(clientId),
                verifyOtpPerIp,
                verifyOtpWindowSeconds,
                "Too many OTP verification attempts from this IP. Please try again later."
        );
        enforce(
                "auth:verify-otp:email:" + normalizedEmail,
                verifyOtpPerEmail,
                verifyOtpWindowSeconds,
                "Too many OTP verification attempts for this email. Please request a new OTP later."
        );
    }

    private void enforce(String key, int limit, long windowSeconds, String message) {
        if (limit <= 0 || windowSeconds <= 0) {
            return;
        }

        long now = System.currentTimeMillis();
        long windowMillis = windowSeconds * 1000L;

        CounterWindow updated = counters.compute(key, (k, existing) -> {
            if (existing == null || now - existing.windowStartMillis >= windowMillis) {
                return new CounterWindow(now, 1);
            }
            return new CounterWindow(existing.windowStartMillis, existing.count + 1);
        });

        if (counters.size() > maxEntries) {
            evictExpiredEntries(now);
        }

        if (updated != null && updated.count > limit) {
            throw new TooManyRequestsException(message);
        }
    }

    private void evictExpiredEntries(long now) {
        long longestWindowSeconds = Math.max(loginWindowSeconds, Math.max(registerWindowSeconds, verifyOtpWindowSeconds));
        long staleThresholdMillis = Math.max(longestWindowSeconds, 60L) * 1000L * 2;
        counters.entrySet().removeIf(entry -> now - entry.getValue().windowStartMillis >= staleThresholdMillis);
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return "unknown";
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeKey(String value) {
        if (value == null || value.isBlank()) {
            return "unknown";
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }
}
