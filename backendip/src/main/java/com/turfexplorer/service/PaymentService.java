package com.turfexplorer.service;

import com.turfexplorer.entity.Booking;
import com.turfexplorer.entity.Slot;
import com.turfexplorer.entity.Transaction;
import com.turfexplorer.entity.User;
import com.turfexplorer.enums.BookingStatus;
import com.turfexplorer.enums.TransactionStatus;
import com.turfexplorer.exception.BadRequestException;
import com.turfexplorer.exception.ResourceNotFoundException;
import com.turfexplorer.repository.BookingRepository;
import com.turfexplorer.repository.SlotRepository;
import com.turfexplorer.repository.TransactionRepository;
import com.turfexplorer.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private SlotRepository slotRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${bkash.app.key:}")
    private String bkashAppKey;

    @Value("${bkash.app.secret:}")
    private String bkashAppSecret;

    @Value("${bkash.username:}")
    private String bkashUsername;

    @Value("${bkash.password:}")
    private String bkashPassword;

    @Value("${bkash.base.url:}")
    private String bkashBaseUrl;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${bkash.default.payer.reference:01770618575}")
    private String defaultPayerReference;

    @Transactional
    public Map<String, Object> createBkashPayment(Long userId, Long bookingId) {
        validateBkashConfig();

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (!booking.getUserId().equals(userId)) {
            throw new AccessDeniedException("You can only pay for your own bookings");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Cancelled bookings cannot be paid");
        }

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            throw new BadRequestException("Booking is already confirmed");
        }

        Slot slot = slotRepository.findById(booking.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));

        if (slot.getPrice() == null) {
            throw new BadRequestException("Slot price is missing");
        }

        double amount = slot.getPrice();
        String amountAsString = BigDecimal.valueOf(amount)
                .setScale(2, RoundingMode.HALF_UP)
                .toPlainString();

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String payerReference = buildPayerReference(user.getPhone());

        String token = grantToken();
        Map<String, Object> createResponse = createPayment(token, booking.getId(), amountAsString, payerReference);
        log.info("bKash create payment raw response for bookingId={}: {}", booking.getId(), createResponse);

        String statusCode = getFirstNonBlank(createResponse, "statusCode", "status_code");
        String statusMessage = getFirstNonBlank(createResponse, "statusMessage", "status_message", "message");
        if (StringUtils.hasText(statusCode) && !"0000".equals(statusCode)) {
            throw new BadRequestException("bKash create payment failed [" + statusCode + "]: "
                    + (StringUtils.hasText(statusMessage) ? statusMessage : "Unknown error"));
        }

        String paymentId = getFirstNonBlank(createResponse, "paymentID", "paymentId", "paymentid");
        String bkashUrl = getFirstNonBlank(createResponse, "bkashURL", "bkashUrl", "bkashurl");

        if (!StringUtils.hasText(paymentId)) {
            throw new BadRequestException("bKash create payment did not return paymentID. Response: " + createResponse);
        }

        if (!StringUtils.hasText(bkashUrl)) {
            throw new BadRequestException("bKash create payment did not return bkashURL. Response: " + createResponse);
        }

        Transaction transaction = new Transaction();
        transaction.setBookingId(booking.getId());
        transaction.setAmount(amount);
        transaction.setStatus(TransactionStatus.PENDING);
        transaction.setPaymentId(paymentId);
        try {
            Transaction existing = transactionRepository.findByPaymentId(paymentId).orElse(null);
            if (existing != null) {
                existing.setBookingId(booking.getId());
                existing.setAmount(amount);
                existing.setStatus(TransactionStatus.PENDING);
                existing.setTrxId(null);
                transactionRepository.save(existing);
            } else {
                transactionRepository.save(transaction);
            }
        } catch (Exception ex) {
            log.error("Failed to save transaction for bookingId={} paymentId={}", booking.getId(), paymentId, ex);
            String cause = ex.getMessage();
            if (ex.getCause() != null && ex.getCause().getMessage() != null) {
                cause = ex.getCause().getMessage();
            }
            throw new BadRequestException("Failed to save payment transaction: " + cause);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Payment session created successfully");
        response.put("bkashURL", bkashUrl);
        response.put("paymentID", paymentId);
        return response;
    }

    @Transactional
    public Map<String, Object> executeBkashPayment(Long userId, String paymentId) {
        validateBkashConfig();

        if (!StringUtils.hasText(paymentId)) {
            throw new BadRequestException("paymentID is required");
        }

        Transaction transaction = transactionRepository.findByPaymentId(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found for this paymentID"));

        Booking booking = bookingRepository.findById(transaction.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found for transaction"));

        if (!booking.getUserId().equals(userId)) {
            throw new AccessDeniedException("You can only execute payment for your own bookings");
        }

        if (transaction.getStatus() == TransactionStatus.SUCCESS) {
            return buildExecuteResponse(transaction, booking, paymentId, transaction.getTrxId(), "ALREADY_EXECUTED");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new BadRequestException("Booking is cancelled. Payment cannot be executed");
        }

        String token = grantToken();
        Map<String, Object> executeResponse = executePayment(token, paymentId);

        String paymentStatus = getFirstNonBlank(executeResponse, "paymentStatus", "transactionStatus");
        String statusCode = asString(executeResponse.get("statusCode"));
        String trxId = getFirstNonBlank(executeResponse, "trxID", "trxId", "trxid");
        String statusMessage = asString(executeResponse.get("statusMessage"));

        boolean isCompleted = "Completed".equalsIgnoreCase(paymentStatus) || "0000".equals(statusCode);

        if (!isCompleted && isSystemError(statusMessage)) {
            log.warn("bKash execute returned System Error for paymentID={}. Querying payment status as fallback.", paymentId);

            Map<String, Object> queryResponse = queryPaymentStatus(token, paymentId);
            String queriedPaymentStatus = getFirstNonBlank(queryResponse, "paymentStatus", "transactionStatus");
            String queriedStatusCode = asString(queryResponse.get("statusCode"));
            String queriedTrxId = getFirstNonBlank(queryResponse, "trxID", "trxId", "trxid");
            String queriedStatusMessage = asString(queryResponse.get("statusMessage"));

            boolean queryCompleted = "Completed".equalsIgnoreCase(queriedPaymentStatus) || "0000".equals(queriedStatusCode);
            if (queryCompleted) {
                executeResponse = queryResponse;
                paymentStatus = queriedPaymentStatus;
                statusCode = queriedStatusCode;
                trxId = queriedTrxId;
                statusMessage = queriedStatusMessage;
                isCompleted = true;
                log.warn("Recovered execute flow via payment-status fallback for paymentID={}", paymentId);
            } else {
                log.warn("Payment status fallback not completed for paymentID={}. Retrying execute once.", paymentId);
                Map<String, Object> retryExecuteResponse = executePayment(token, paymentId);
                String retryPaymentStatus = getFirstNonBlank(retryExecuteResponse, "paymentStatus", "transactionStatus");
                String retryStatusCode = asString(retryExecuteResponse.get("statusCode"));
                String retryTrxId = getFirstNonBlank(retryExecuteResponse, "trxID", "trxId", "trxid");
                String retryStatusMessage = asString(retryExecuteResponse.get("statusMessage"));

                boolean retryCompleted = "Completed".equalsIgnoreCase(retryPaymentStatus) || "0000".equals(retryStatusCode);
                if (retryCompleted) {
                    executeResponse = retryExecuteResponse;
                    paymentStatus = retryPaymentStatus;
                    statusCode = retryStatusCode;
                    trxId = retryTrxId;
                    statusMessage = retryStatusMessage;
                    isCompleted = true;
                    log.warn("Recovered execute flow via retry for paymentID={}", paymentId);
                }
            }
        }

        if (!isCompleted) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new BadRequestException("bKash execute failed: " + (StringUtils.hasText(statusMessage) ? statusMessage : "Payment not completed"));
        }

        if (!StringUtils.hasText(trxId)) {
            try {
                trxId = resolveExecuteTrxId(token, paymentId, transaction);
            } catch (Exception ex) {
                log.warn("Could not resolve trxID from bKash payment status for paymentID={}", paymentId, ex);
            }
        }

        if (!StringUtils.hasText(trxId)) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new BadRequestException("bKash execute failed: trxID missing in successful payment response");
        }

        Transaction existingByTrx = transactionRepository.findByTrxId(trxId).orElse(null);
        if (existingByTrx != null && !existingByTrx.getId().equals(transaction.getId())) {
            Booking existingBooking = bookingRepository.findById(existingByTrx.getBookingId()).orElse(booking);
            if (existingByTrx.getStatus() == TransactionStatus.SUCCESS || existingByTrx.getStatus() == TransactionStatus.REFUNDED) {
                return buildExecuteResponse(existingByTrx, existingBooking, existingByTrx.getPaymentId(), trxId, "ALREADY_EXECUTED");
            }
        }

        transaction.setTrxId(trxId);
        markPaymentSuccess(transaction, booking);
        log.info("Transaction saved after execute. transactionId={} bookingId={} paymentID={} trxID={} amount={} status={}",
                transaction.getId(),
                booking.getId(),
                transaction.getPaymentId(),
                transaction.getTrxId(),
                transaction.getAmount(),
                transaction.getStatus());

        return buildExecuteResponse(transaction, booking, paymentId, trxId, "SUCCESS");
    }

    private Map<String, Object> buildExecuteResponse(Transaction transaction, Booking booking, String paymentId, String trxId, String result) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Payment confirmed successfully");
        response.put("result", result);
        response.put("paymentID", paymentId);
        response.put("trxID", trxId != null ? trxId : transaction.getTrxId());
        response.put("amount", transaction.getAmount());
        response.put("transactionStatus", transaction.getStatus().name());
        response.put("bookingStatus", booking.getStatus().name());
        return response;
    }

    @Transactional
    public Map<String, Object> cancelBkashPayment(Long userId, String paymentId) {
        if (!StringUtils.hasText(paymentId)) {
            throw new BadRequestException("paymentID is required");
        }

        Transaction transaction = transactionRepository.findByPaymentId(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found for this paymentID"));

        Booking booking = bookingRepository.findById(transaction.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found for transaction"));

        if (!booking.getUserId().equals(userId)) {
            throw new AccessDeniedException("You can only cancel payment for your own bookings");
        }

        if (transaction.getStatus() == TransactionStatus.SUCCESS || booking.getStatus() == BookingStatus.CONFIRMED) {
            throw new BadRequestException("Payment already completed. Cannot cancel this payment");
        }

        boolean alreadyCancelled = transaction.getStatus() == TransactionStatus.FAILED
                && booking.getStatus() == BookingStatus.CANCELLED;

        transaction.setStatus(TransactionStatus.FAILED);
        booking.setStatus(BookingStatus.CANCELLED);
        transactionRepository.save(transaction);
        bookingRepository.save(booking);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Payment cancelled and booking released");
        response.put("result", alreadyCancelled ? "ALREADY_CANCELLED" : "CANCELLED");
        response.put("paymentID", transaction.getPaymentId());
        response.put("transactionStatus", transaction.getStatus().name());
        response.put("bookingStatus", booking.getStatus().name());
        return response;
    }

    @Transactional
    public Map<String, Object> refundBkashPayment(Long userId, Long transactionId) {
        validateBkashConfig();

        Transaction transaction = transactionRepository.findById(transactionId)
            .orElseThrow(() -> new BadRequestException("Invalid refund request"));

        Booking booking = bookingRepository.findById(transaction.getBookingId())
            .orElseThrow(() -> new BadRequestException("Invalid refund request"));

        if (!booking.getUserId().equals(userId)) {
            throw new AccessDeniedException("You are not allowed to request refund for this booking");
        }

        if (transaction.getStatus() == TransactionStatus.REFUNDED) {
            return buildRefundResponse(transaction, booking, "ALREADY_REFUNDED");
        }

        if (transaction.getStatus() != TransactionStatus.SUCCESS
                || booking.getStatus() != BookingStatus.CANCELLED
                || !StringUtils.hasText(transaction.getPaymentId())) {
            throw new BadRequestException("Invalid refund request");
        }

        enforceRefundAdvanceWindow(booking);

        String token = grantToken();
        String trxId = resolveRefundTrxId(token, transaction);
        if (!StringUtils.hasText(trxId)) {
            throw new BadRequestException("Invalid refund request");
        }

        log.info("Refund requested. userId={} transactionId={} bookingId={} paymentId={} trxID={} amount={} status={}",
            userId,
            transaction.getId(),
            booking.getId(),
            transaction.getPaymentId(),
            trxId,
            transaction.getAmount(),
            transaction.getStatus());

        Map<String, Object> refundResponse = refundPayment(token, transaction.getPaymentId(), trxId, transaction.getAmount(), booking.getId());

        String refundStatus = asString(refundResponse.get("transactionStatus"));
        String statusCode = asString(refundResponse.get("statusCode"));
        String statusMessage = asString(refundResponse.get("statusMessage"));

        if ("Completed".equalsIgnoreCase(refundStatus) || "0000".equals(statusCode)) {
            transaction.setStatus(TransactionStatus.REFUNDED);
            transactionRepository.save(transaction);
            return buildRefundResponse(transaction, booking, "SUCCESS");
        }

        if (isAlreadyReversedRefund(statusCode, statusMessage)) {
            transaction.setStatus(TransactionStatus.REFUNDED);
            transactionRepository.save(transaction);
            return buildRefundResponse(transaction, booking, "ALREADY_REFUNDED");
        }

        // bKash sandbox may intermittently return System Error when an old/stale trxID is provided.
        // Re-query once and retry with the latest trxID if available.
        if ("System Error".equalsIgnoreCase(statusMessage)) {
            String refreshedTrxId = resolveRefundTrxId(token, transaction);
            if (StringUtils.hasText(refreshedTrxId) && !refreshedTrxId.equals(trxId)) {
                log.warn("Refund retry with refreshed trxID. transactionId={} oldTrxID={} newTrxID={}",
                        transaction.getId(),
                        trxId,
                        refreshedTrxId);

                Map<String, Object> retryResponse = refundPayment(token, transaction.getPaymentId(), refreshedTrxId, transaction.getAmount(), booking.getId());
                String retryRefundStatus = asString(retryResponse.get("transactionStatus"));
                String retryStatusCode = asString(retryResponse.get("statusCode"));

                if ("Completed".equalsIgnoreCase(retryRefundStatus) || "0000".equals(retryStatusCode)) {
                    transaction.setStatus(TransactionStatus.REFUNDED);
                    transactionRepository.save(transaction);
                    return buildRefundResponse(transaction, booking, "SUCCESS");
                }

                refundResponse = retryResponse;
                refundStatus = retryRefundStatus;
                statusCode = retryStatusCode;
                statusMessage = asString(retryResponse.get("statusMessage"));
                trxId = refreshedTrxId;

                if (isAlreadyReversedRefund(statusCode, statusMessage)) {
                    transaction.setStatus(TransactionStatus.REFUNDED);
                    transactionRepository.save(transaction);
                    return buildRefundResponse(transaction, booking, "ALREADY_REFUNDED");
                }
            }
        }

        String errorCode = asString(refundResponse.get("errorCode"));
        log.warn("Refund failed from bKash. transactionId={} paymentId={} trxID={} statusCode={} transactionStatus={} statusMessage={} rawResponse={}",
                transaction.getId(),
                transaction.getPaymentId(),
                trxId,
                statusCode,
                refundStatus,
                statusMessage,
                refundResponse);

        StringBuilder failureMessage = new StringBuilder("bKash refund failed");
        if (StringUtils.hasText(statusCode)) {
            failureMessage.append(" [").append(statusCode).append("]");
        }
        if (StringUtils.hasText(errorCode)) {
            failureMessage.append(" {errorCode=").append(errorCode).append("}");
        }
        failureMessage.append(": ").append(StringUtils.hasText(statusMessage) ? statusMessage : "Refund not completed");

        throw new BadRequestException(failureMessage.toString());
    }

    private void enforceRefundAdvanceWindow(Booking booking) {
        Slot slot = slotRepository.findById(booking.getSlotId())
                .orElseThrow(() -> new BadRequestException("Invalid refund request"));

        LocalDateTime bookingStartDateTime = LocalDateTime.of(booking.getBookingDate(), slot.getStartTime());
        LocalDateTime now = LocalDateTime.now();
        Duration timeUntilBooking = Duration.between(now, bookingStartDateTime);

        if (timeUntilBooking.compareTo(Duration.ofHours(24)) < 0) {
            throw new BadRequestException("Not eligible for refund: Cancellations must be made at least 24 hours in advance.");
        }
    }

    private boolean isAlreadyReversedRefund(String statusCode, String statusMessage) {
        if ("2034".equals(statusCode)) {
            return true;
        }
        return StringUtils.hasText(statusMessage)
                && statusMessage.toLowerCase().contains("has been reversed");
    }

    private boolean isSystemError(String statusMessage) {
        return StringUtils.hasText(statusMessage)
                && statusMessage.toLowerCase().contains("system error");
    }

    private Map<String, Object> buildRefundResponse(Transaction transaction, Booking booking, String result) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Refund processed successfully");
        response.put("result", result);
        response.put("transactionId", transaction.getId());
        response.put("paymentID", transaction.getPaymentId());
        response.put("trxID", transaction.getTrxId());
        response.put("amount", transaction.getAmount());
        response.put("transactionStatus", transaction.getStatus().name());
        response.put("bookingStatus", booking.getStatus().name());
        return response;
    }

    private void markPaymentSuccess(Transaction transaction, Booking booking) {
        boolean slotAlreadyConfirmedByAnotherBooking = bookingRepository
                .findBySlotIdAndBookingDateAndStatus(booking.getSlotId(), booking.getBookingDate(), BookingStatus.CONFIRMED)
                .filter(existing -> !existing.getId().equals(booking.getId()))
                .isPresent();

        if (slotAlreadyConfirmedByAnotherBooking) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new BadRequestException("Slot already confirmed by another booking");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        transaction.setStatus(TransactionStatus.SUCCESS);
        transactionRepository.save(transaction);
    }

    private String grantToken() {
        String url = normalizeBaseUrl() + "/checkout/token/grant";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("username", bkashUsername);
        headers.set("password", bkashPassword);

        Map<String, String> body = new HashMap<>();
        body.put("app_key", bkashAppKey);
        body.put("app_secret", bkashAppSecret);

        Map<String, Object> payload = postForMap(url, headers, body, "grant token");
        String idToken = asString(payload.get("id_token"));

        if (!StringUtils.hasText(idToken)) {
            throw new BadRequestException("bKash token grant response missing id_token");
        }

        return idToken;
    }

    private Map<String, Object> createPayment(String idToken, Long bookingId, String amountAsString, String payerReference) {
        String url = normalizeBaseUrl() + "/checkout/create";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", idToken);
        headers.set("X-APP-Key", bkashAppKey);

        Map<String, String> body = new HashMap<>();
        body.put("mode", "0011");
        body.put("amount", amountAsString);
        body.put("currency", "BDT");
        body.put("intent", "sale");
        body.put("payerReference", payerReference);
        body.put("merchantInvoiceNumber", String.valueOf(bookingId));
        body.put("callbackURL", buildPaymentCallbackUrl());

        return postForMap(url, headers, body, "create payment");
    }

    private Map<String, Object> executePayment(String idToken, String paymentId) {
        String url = normalizeBaseUrl() + "/checkout/execute";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", idToken);
        headers.set("X-APP-Key", bkashAppKey);

        Map<String, String> body = new HashMap<>();
        body.put("paymentID", paymentId);

        return postForMap(url, headers, body, "execute payment");
    }

    private Map<String, Object> refundPayment(String idToken, String paymentId, String trxId, Double amount, Long bookingId) {
        String url = normalizeBaseUrl() + "/checkout/payment/refund";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", idToken);
        headers.set("X-APP-Key", bkashAppKey);

        Map<String, String> body = new HashMap<>();
        body.put("paymentID", paymentId);
        body.put("trxID", trxId);
        body.put("amount", BigDecimal.valueOf(amount).setScale(2, RoundingMode.HALF_UP).toPlainString());
        body.put("sku", "TurfBooking-" + bookingId);
        body.put("reason", "Customer cancellation refund");

        return postForMap(url, headers, body, "refund payment");
    }

    private Map<String, Object> queryPaymentStatus(String idToken, String paymentId) {
        String url = normalizeBaseUrl() + "/checkout/payment/status";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", idToken);
        headers.set("X-APP-Key", bkashAppKey);

        Map<String, String> body = new HashMap<>();
        body.put("paymentID", paymentId);

        return postForMap(url, headers, body, "query payment");
    }

    private String resolveRefundTrxId(String token, Transaction transaction) {
        String storedTrxId = transaction.getTrxId();

        if (StringUtils.hasText(storedTrxId)) {
            return storedTrxId;
        }

        log.warn("Stored trxID missing or legacy for transactionId={} paymentId={}. Querying bKash payment status.",
                transaction.getId(),
                transaction.getPaymentId());

        Map<String, Object> queryResponse = queryPaymentStatus(token, transaction.getPaymentId());
        String queriedTrxId = getFirstNonBlank(queryResponse, "trxID", "trxId", "trxid");

        if (StringUtils.hasText(queriedTrxId)) {
            transaction.setTrxId(queriedTrxId);
            transactionRepository.save(transaction);
            return queriedTrxId;
        }

        throw new BadRequestException("Original trxID could not be resolved for this transaction");
    }

    private String resolveExecuteTrxId(String token, String paymentId, Transaction transaction) {
        Map<String, Object> queryResponse = queryPaymentStatus(token, paymentId);
        String queriedTrxId = getFirstNonBlank(queryResponse, "trxID", "trxId", "trxid");
        if (StringUtils.hasText(queriedTrxId)) {
            transaction.setTrxId(queriedTrxId);
            transactionRepository.save(transaction);
            return queriedTrxId;
        }
        return null;
    }

    private Map<String, Object> postForMap(String url, HttpHeaders headers, Map<String, String> body, String operation) {
        try {
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getBody() == null) {
                throw new BadRequestException("bKash " + operation + " returned empty response");
            }

            return response.getBody();
        } catch (HttpStatusCodeException ex) {
            log.error("bKash {} failed. status={} body={}", operation, ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new BadRequestException("bKash " + operation + " failed: " + ex.getResponseBodyAsString());
        } catch (Exception ex) {
            log.error("bKash {} failed: {}", operation, ex.getMessage(), ex);
            throw new BadRequestException("bKash " + operation + " failed: " + ex.getMessage());
        }
    }

    private String normalizeBaseUrl() {
        String url = bkashBaseUrl;
        if (!StringUtils.hasText(url)) {
            throw new BadRequestException("bKash base url is not configured");
        }
        while (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        return url;
    }

    private String buildPaymentCallbackUrl() {
        String baseUrl = frontendUrl;
        if (!StringUtils.hasText(baseUrl)) {
            baseUrl = "http://localhost:3000";
        }

        while (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }

        return baseUrl + "/payment-success";
    }

    private void validateBkashConfig() {
        if (!StringUtils.hasText(bkashAppKey)) {
            throw new BadRequestException("bKash app key is not configured");
        }
        if (!StringUtils.hasText(bkashAppSecret)) {
            throw new BadRequestException("bKash app secret is not configured");
        }
        if (!StringUtils.hasText(bkashUsername)) {
            throw new BadRequestException("bKash username is not configured");
        }
        if (!StringUtils.hasText(bkashPassword)) {
            throw new BadRequestException("bKash password is not configured");
        }
        if (!StringUtils.hasText(bkashBaseUrl)) {
            throw new BadRequestException("bKash base url is not configured");
        }
    }

    private String asString(Object value) {
        if (value == null) {
            return null;
        }
        return String.valueOf(value);
    }

    private String buildPayerReference(String phone) {
        if (StringUtils.hasText(phone)) {
            String digits = phone.replaceAll("\\D", "");
            if (digits.startsWith("880") && digits.length() == 13) {
                digits = "0" + digits.substring(3);
            } else if (digits.startsWith("88") && digits.length() == 13) {
                digits = "0" + digits.substring(2);
            }

            if (digits.matches("01\\d{9}")) {
                return digits;
            }
        }

        return defaultPayerReference;
    }

    private String getFirstNonBlank(Map<String, Object> payload, String... keys) {
        if (payload == null || keys == null) {
            return null;
        }
        for (String key : keys) {
            String value = asString(payload.get(key));
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return null;
    }
}
