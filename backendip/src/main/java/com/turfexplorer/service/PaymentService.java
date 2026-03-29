package com.turfexplorer.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.turfexplorer.dto.BookingRequest;
import com.turfexplorer.dto.BookingResponse;
import com.turfexplorer.dto.OwnerEarningsResponse;
import com.turfexplorer.dto.PaymentCallbackResultResponse;
import com.turfexplorer.dto.PaymentInitRequest;
import com.turfexplorer.dto.PaymentInitResponse;
import com.turfexplorer.entity.Booking;
import com.turfexplorer.entity.Payment;
import com.turfexplorer.entity.Slot;
import com.turfexplorer.entity.Turf;
import com.turfexplorer.enums.BookingStatus;
import com.turfexplorer.enums.PaymentStatus;
import com.turfexplorer.enums.SlotStatus;
import com.turfexplorer.enums.TurfStatus;
import com.turfexplorer.exception.BadRequestException;
import com.turfexplorer.exception.ResourceNotFoundException;
import com.turfexplorer.repository.BookingRepository;
import com.turfexplorer.repository.PaymentRepository;
import com.turfexplorer.repository.SlotRepository;
import com.turfexplorer.repository.TurfRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentService {

    private static final long PENDING_PAYMENT_TIMEOUT_MINUTES = 15;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TurfRepository turfRepository;

    @Autowired
    private SlotRepository slotRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${ssl.base.url}")
    private String sslBaseUrl;

    @Value("${ssl.store.id}")
    private String storeId;

    @Value("${ssl.store.password}")
    private String storePassword;

    @Value("${ssl.success.url}")
    private String successUrl;

    @Value("${ssl.fail.url}")
    private String failUrl;

    @Value("${ssl.cancel.url}")
    private String cancelUrl;

    @Value("${ssl.frontend.success.url}")
    private String frontendSuccessUrl;

    @Value("${ssl.frontend.fail.url}")
    private String frontendFailUrl;

    @Value("${ssl.frontend.cancel.url}")
    private String frontendCancelUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @Transactional
    public PaymentInitResponse initPayment(Long userId, String customerName, String customerEmail, PaymentInitRequest request) {
        validateSslConfig();

        Turf turf = turfRepository.findById(request.getTurfId())
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found"));

        if (turf.getStatus() != TurfStatus.APPROVED) {
            throw new BadRequestException("Turf is not available for booking");
        }

        Slot slot = slotRepository.findById(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));

        if (!slot.getTurfId().equals(request.getTurfId())) {
            throw new BadRequestException("Slot does not belong to this turf");
        }

        if (slot.getStatus() != SlotStatus.AVAILABLE) {
            throw new BadRequestException("Slot is not available");
        }

        if (bookingRepository.findBySlotIdAndBookingDateAndStatus(
                request.getSlotId(),
                request.getBookingDate(),
                BookingStatus.CONFIRMED
        ).isPresent()) {
            throw new BadRequestException("Slot is already booked for this date");
        }

        // Reconcile any existing payment session for this slot/date before creating a new one.
        Payment activePayment = paymentRepository.findFirstBySlotIdAndBookingDateAndStatusInOrderByCreatedAtDesc(
                request.getSlotId(),
                request.getBookingDate(),
                Arrays.asList(PaymentStatus.PENDING, PaymentStatus.SUCCESS, PaymentStatus.PARTIAL, PaymentStatus.FULL)
        ).orElse(null);

        if (activePayment != null) {
            if (activePayment.getStatus() == PaymentStatus.PENDING) {
                activePayment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(activePayment);
            }

            if (isPaidStatus(activePayment.getStatus()) && activePayment.getBookingId() != null) {
                boolean hasConfirmedBooking = false;
                Optional<Booking> activePaymentBooking = bookingRepository.findById(activePayment.getBookingId());
                if (activePaymentBooking.isPresent()) {
                    Booking foundBooking = activePaymentBooking.get();
                    if (foundBooking.getStatus() == BookingStatus.CONFIRMED) {
                        hasConfirmedBooking = true;
                    }
                }

                if (hasConfirmedBooking) {
                    throw new BadRequestException("Payment already completed for this slot and date");
                }
            }

            if (activePayment.getStatus() != PaymentStatus.PENDING) {
                activePayment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(activePayment);
            }
        }

        double totalAmount = roundAmount(slot.getPrice());
        double paidAmount = calculateAdvanceAmount(totalAmount);

        String transactionId = generateTransactionId();

        MultiValueMap<String, String> payload = new LinkedMultiValueMap<>();
        payload.add("store_id", storeId);
        payload.add("store_passwd", storePassword);
        payload.add("total_amount", formatAmount(paidAmount));
        payload.add("currency", "BDT");
        payload.add("tran_id", transactionId);
        payload.add("success_url", successUrl);
        payload.add("fail_url", failUrl);
        payload.add("cancel_url", cancelUrl);
        payload.add("cus_name", safeValue(customerName, "Test User"));
        payload.add("cus_email", safeValue(customerEmail, "test@mail.com"));
        payload.add("cus_add1", "Dhaka");
        payload.add("cus_city", "Dhaka");
        payload.add("cus_country", "Bangladesh");
        payload.add("cus_phone", "01711111111");
        payload.add("shipping_method", "NO");
        payload.add("product_name", "Turf Booking");
        payload.add("product_category", "Service");
        payload.add("product_profile", "general");

        Map<String, Object> initResponse = createSslSession(payload);
        String gatewayPageURL = getString(initResponse, "GatewayPageURL");
        String status = getString(initResponse, "status");

        if (!"SUCCESS".equalsIgnoreCase(status) || isBlank(gatewayPageURL)) {
            throw new BadRequestException("Failed to initialize SSLCOMMERZ session");
        }

        Payment payment = new Payment();
        payment.setUserId(userId);
        payment.setTurfId(request.getTurfId());
        payment.setSlotId(request.getSlotId());
        payment.setBookingDate(request.getBookingDate());
        Optional<Booking> existingBookingOptional = bookingRepository.findFirstByUserIdAndSlotIdAndBookingDateAndStatusInOrderByCreatedAtDesc(
                userId,
                request.getSlotId(),
                request.getBookingDate(),
                Arrays.asList(BookingStatus.PENDING, BookingStatus.CONFIRMED)
        );
        if (existingBookingOptional.isPresent()) {
            Booking existingBooking = existingBookingOptional.get();
            if (existingBooking.getTurfId().equals(request.getTurfId())) {
                payment.setBookingId(existingBooking.getId());
            }
        }
        payment.setAmount(paidAmount);
        payment.setTotalAmount(totalAmount);
        payment.setPaidAmount(paidAmount);
        payment.setIsPartial(Boolean.TRUE);
        payment.setTransactionId(transactionId);
        payment.setBkashPaymentId(transactionId);
        payment.setMerchantInvoiceNumber(transactionId);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setRawInitResponse(toJson(initResponse));
        payment.setRawCreateResponse(payment.getRawInitResponse());
        paymentRepository.save(payment);

        return new PaymentInitResponse(
                transactionId,
                gatewayPageURL,
                "Pay 50% to confirm booking",
                totalAmount,
                paidAmount,
                true
        );
    }

    @Transactional
    public PaymentInitResponse initRemainingPayment(Long userId, String customerName, String customerEmail, Long bookingId) {
        validateSslConfig();

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (!booking.getUserId().equals(userId)) {
            throw new BadRequestException("You can only pay for your own booking");
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED || booking.getPaymentStatus() != PaymentStatus.PARTIAL) {
            throw new BadRequestException("Remaining payment is only available for partially paid confirmed bookings");
        }

        double rawDueAmount = 0.0;
        if (booking.getDueAmount() != null) {
            rawDueAmount = booking.getDueAmount();
        }
        double dueAmount = roundAmount(rawDueAmount);
        if (dueAmount <= 0) {
            throw new BadRequestException("No due amount left for this booking");
        }

        // A user can only keep one active pending due-payment session at a time.
        Payment existingPending = paymentRepository.findFirstByUserIdAndSlotIdAndBookingDateAndStatusInOrderByCreatedAtDesc(
                userId,
                booking.getSlotId(),
                booking.getBookingDate(),
            Arrays.asList(PaymentStatus.PENDING)
        ).orElse(null);
        if (existingPending != null) {
            existingPending.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(existingPending);
        }

        String transactionId = generateTransactionId();

        MultiValueMap<String, String> payload = new LinkedMultiValueMap<>();
        payload.add("store_id", storeId);
        payload.add("store_passwd", storePassword);
        payload.add("total_amount", formatAmount(dueAmount));
        payload.add("currency", "BDT");
        payload.add("tran_id", transactionId);
        payload.add("success_url", successUrl);
        payload.add("fail_url", failUrl);
        payload.add("cancel_url", cancelUrl);
        payload.add("cus_name", safeValue(customerName, "Test User"));
        payload.add("cus_email", safeValue(customerEmail, "test@mail.com"));
        payload.add("cus_add1", "Dhaka");
        payload.add("cus_city", "Dhaka");
        payload.add("cus_country", "Bangladesh");
        payload.add("cus_phone", "01711111111");
        payload.add("shipping_method", "NO");
        payload.add("product_name", "Turf Booking Due Payment");
        payload.add("product_category", "Service");
        payload.add("product_profile", "general");

        Map<String, Object> initResponse = createSslSession(payload);
        String gatewayPageURL = getString(initResponse, "GatewayPageURL");
        String status = getString(initResponse, "status");

        if (!"SUCCESS".equalsIgnoreCase(status) || isBlank(gatewayPageURL)) {
            throw new BadRequestException("Failed to initialize SSLCOMMERZ session");
        }

        Payment payment = new Payment();
        payment.setUserId(userId);
        payment.setTurfId(booking.getTurfId());
        payment.setSlotId(booking.getSlotId());
        payment.setBookingDate(booking.getBookingDate());
        payment.setBookingId(bookingId);
        payment.setAmount(dueAmount);
        double totalAmountForPayment = dueAmount;
        if (booking.getTotalAmount() != null) {
            totalAmountForPayment = booking.getTotalAmount();
        }
        payment.setTotalAmount(roundAmount(totalAmountForPayment));
        payment.setPaidAmount(dueAmount);
        payment.setIsPartial(Boolean.FALSE);
        payment.setTransactionId(transactionId);
        payment.setBkashPaymentId(transactionId);
        payment.setMerchantInvoiceNumber(transactionId);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setRawInitResponse(toJson(initResponse));
        payment.setRawCreateResponse(payment.getRawInitResponse());
        paymentRepository.save(payment);

        return new PaymentInitResponse(
                transactionId,
                gatewayPageURL,
                "Proceed to pay the remaining booking amount",
                payment.getTotalAmount(),
                dueAmount,
                false
        );
    }

    @Transactional
    public PaymentCallbackResultResponse handleSuccessCallback(Map<String, String> callbackData) {
        String transactionId = callbackData.get("tran_id");
        if (isBlank(transactionId)) {
            throw new BadRequestException("Missing transaction id in callback");
        }

        Payment payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        return completeSuccess(payment, callbackData.get("val_id"));
    }

    @Transactional
    public PaymentCallbackResultResponse verifySuccessForUser(Long userId, String transactionId, String valId) {
        if (isBlank(transactionId)) {
            throw new BadRequestException("Missing transaction id");
        }

        Payment payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if (!payment.getUserId().equals(userId)) {
            throw new BadRequestException("You can only verify your own payment");
        }

        return completeSuccess(payment, valId);
    }

    @Transactional
    public PaymentCallbackResultResponse verifyFailForUser(Long userId, String transactionId) {
        if (isBlank(transactionId)) {
            throw new BadRequestException("Missing transaction id");
        }

        Payment payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if (!payment.getUserId().equals(userId)) {
            throw new BadRequestException("You can only update your own payment");
        }

        if (!isPaidStatus(payment.getStatus())) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
        }

        return new PaymentCallbackResultResponse("FAILED", "Payment failed", payment.getTransactionId(), payment.getBookingId());
    }

    @Transactional
    public PaymentCallbackResultResponse verifyCancelForUser(Long userId, String transactionId) {
        if (isBlank(transactionId)) {
            throw new BadRequestException("Missing transaction id");
        }

        Payment payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if (!payment.getUserId().equals(userId)) {
            throw new BadRequestException("You can only update your own payment");
        }

        if (!isPaidStatus(payment.getStatus())) {
            payment.setStatus(PaymentStatus.CANCELLED);
            paymentRepository.save(payment);
        }

        return new PaymentCallbackResultResponse("CANCELLED", "Payment cancelled", payment.getTransactionId(), payment.getBookingId());
    }

    private PaymentCallbackResultResponse completeSuccess(Payment payment, String valId) {

        // This guard prevents old/replaced payment links from being accepted later.
        if (payment.getStatus() != PaymentStatus.PENDING && !isPaidStatus(payment.getStatus())) {
            return new PaymentCallbackResultResponse(
                    "FAILED",
                    "This payment session has expired or was replaced. Please initiate payment again.",
                    payment.getTransactionId(),
                    payment.getBookingId()
            );
        }

        if (isPaidStatus(payment.getStatus())) {
            Booking existingBooking = null;
            if (payment.getBookingId() != null) {
                existingBooking = bookingRepository.findById(payment.getBookingId()).orElse(null);
            }

            if (existingBooking != null) {
                return buildCallbackResponse(
                        "SUCCESS",
                        "Payment already verified",
                        payment,
                        existingBooking
                );
            }
            return new PaymentCallbackResultResponse("SUCCESS", "Payment already verified", payment.getTransactionId(), payment.getBookingId());
        }

        Map<String, Object> validationResponse = validateWithSsl(valId, payment.getTransactionId());
        payment.setRawValidationResponse(toJson(validationResponse));
        payment.setValidationId(valId);

        if (!isValidationSuccess(validationResponse, payment)) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            return new PaymentCallbackResultResponse("FAILED", "Payment validation failed", payment.getTransactionId(), null);
        }

        if (!hasMinimumRequiredPayment(payment)) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            return new PaymentCallbackResultResponse("FAILED", "Minimum 50% advance was not paid", payment.getTransactionId(), null);
        }

        // Double-check slot ownership after gateway success to prevent race-condition double booking.
        Booking existingConfirmedForSlot = bookingRepository.findBySlotIdAndBookingDateAndStatus(
                payment.getSlotId(),
                payment.getBookingDate(),
                BookingStatus.CONFIRMED
        ).orElse(null);
        if (existingConfirmedForSlot != null
                && (payment.getBookingId() == null || !existingConfirmedForSlot.getId().equals(payment.getBookingId()))) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            return new PaymentCallbackResultResponse("FAILED", "Slot already booked by another successful transaction", payment.getTransactionId(), null);
        }

        Booking booking = ensureConfirmedBooking(payment);

        payment.setGatewayTransactionId(getString(validationResponse, "bank_tran_id"));
        payment.setTrxId(payment.getGatewayTransactionId());
        payment.setBookingId(booking.getId());
        if (Boolean.TRUE.equals(payment.getIsPartial())) {
            payment.setStatus(PaymentStatus.PARTIAL);
        } else {
            payment.setStatus(PaymentStatus.FULL);
        }
        payment.setRawExecuteResponse(payment.getRawValidationResponse());
        payment.setRawQueryResponse(payment.getRawValidationResponse());
        paymentRepository.save(payment);

        String successMessage;
        if (Boolean.TRUE.equals(payment.getIsPartial())) {
            successMessage = "Booking confirmed. Remaining amount: " + formatAmount(booking.getDueAmount()) + " BDT";
        } else {
            successMessage = "Remaining payment successful. Booking fully paid.";
        }

        return buildCallbackResponse(
            "SUCCESS",
            successMessage,
            payment,
            booking
        );
    }

    @Transactional
    public PaymentCallbackResultResponse handleFailCallback(Map<String, String> callbackData) {
        String transactionId = callbackData.get("tran_id");
        Payment payment = findPaymentByTransactionId(transactionId);
        if (payment != null && !isPaidStatus(payment.getStatus())) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
        }
        Long bookingId = null;
        if (payment != null) {
            bookingId = payment.getBookingId();
        }

        return new PaymentCallbackResultResponse("FAILED", "Payment failed", transactionId, bookingId);
    }

    @Transactional
    public PaymentCallbackResultResponse handleCancelCallback(Map<String, String> callbackData) {
        String transactionId = callbackData.get("tran_id");
        Payment payment = findPaymentByTransactionId(transactionId);
        if (payment != null && !isPaidStatus(payment.getStatus())) {
            payment.setStatus(PaymentStatus.CANCELLED);
            paymentRepository.save(payment);
        }
        Long bookingId = null;
        if (payment != null) {
            bookingId = payment.getBookingId();
        }

        return new PaymentCallbackResultResponse("CANCELLED", "Payment cancelled", transactionId, bookingId);
    }

    public OwnerEarningsResponse getOwnerEarningsSummary(Long ownerId) {
        Object[] row = paymentRepository.getOwnerEarningsSummary(ownerId, Arrays.asList(
                PaymentStatus.SUCCESS,
                PaymentStatus.PARTIAL,
                PaymentStatus.FULL
        ));
        Long successfulPayments = ((Number) row[0]).longValue();
        Double totalEarnings = ((Number) row[1]).doubleValue();
        return new OwnerEarningsResponse(successfulPayments, totalEarnings);
    }

    public URI buildFrontendRedirectUrl(String status, String transactionId, Long bookingId) {
        String baseUrl = frontendFailUrl;
        if ("SUCCESS".equals(status)) {
            baseUrl = frontendSuccessUrl;
        } else if ("CANCELLED".equals(status)) {
            baseUrl = frontendCancelUrl;
        }

        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(baseUrl);
        if (!isBlank(transactionId)) {
            builder.queryParam("tran_id", transactionId);
        }
        if (bookingId != null) {
            builder.queryParam("booking_id", bookingId);
        }
        return builder.build().toUri();
    }

    private Booking ensureConfirmedBooking(Payment payment) {
        // Reuse existing booking when present, otherwise create one from payment context.
        Booking booking;
        if (payment.getBookingId() != null) {
            booking = bookingRepository.findById(payment.getBookingId())
                    .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        } else {
            BookingRequest bookingRequest = new BookingRequest();
            bookingRequest.setTurfId(payment.getTurfId());
            bookingRequest.setSlotId(payment.getSlotId());
            bookingRequest.setBookingDate(payment.getBookingDate());
            BookingResponse bookingResponse = bookingService.createBooking(payment.getUserId(), bookingRequest);
            booking = bookingRepository.findById(bookingResponse.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Booking not found after creation"));
        }

        booking.setStatus(BookingStatus.CONFIRMED);

        double rawBookingTotal = payment.getAmount();
        if (payment.getTotalAmount() != null) {
            rawBookingTotal = payment.getTotalAmount();
        }
        double bookingTotal = roundAmount(rawBookingTotal);

        double rawPaymentPaid = payment.getAmount();
        if (payment.getPaidAmount() != null) {
            rawPaymentPaid = payment.getPaidAmount();
        }
        double paymentPaid = roundAmount(rawPaymentPaid);

        // Partial payment sets initial paid/due values; remaining payment merges into prior paid amount.
        if (Boolean.TRUE.equals(payment.getIsPartial())) {
            double dueAmount = roundAmount(Math.max(bookingTotal - paymentPaid, 0));
            booking.setTotalAmount(bookingTotal);
            booking.setPaidAmount(paymentPaid);
            booking.setDueAmount(dueAmount);
            booking.setPaymentStatus(PaymentStatus.PARTIAL);
        } else {
            double existingPaid = 0.0;
            if (booking.getPaidAmount() != null) {
                existingPaid = booking.getPaidAmount();
            }
            double mergedPaid = roundAmount(existingPaid + paymentPaid);
            double dueAmount = roundAmount(Math.max(bookingTotal - mergedPaid, 0));
            booking.setTotalAmount(bookingTotal);
            booking.setPaidAmount(mergedPaid);
            booking.setDueAmount(dueAmount);
            if (dueAmount <= 0.009) {
                booking.setPaymentStatus(PaymentStatus.FULL);
            } else {
                booking.setPaymentStatus(PaymentStatus.PARTIAL);
            }
        }

        bookingRepository.save(booking);
        return booking;
    }

    private Map<String, Object> createSslSession(MultiValueMap<String, String> payload) {
        String url = sslBaseUrl + "/gwprocess/v4/api.php";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(payload, headers);
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            return response.getBody();
        } catch (HttpStatusCodeException ex) {
            throw new BadRequestException("SSLCOMMERZ session request failed: " + sanitizeErrorBody(ex.getResponseBodyAsString()));
        } catch (RestClientException ex) {
            throw new BadRequestException("Unable to connect to SSLCOMMERZ session API");
        }
    }

    private Map<String, Object> validateWithSsl(String valId, String transactionId) {
        if (isBlank(valId)) {
            return Map.of("status", "INVALID", "message", "Missing val_id");
        }

        String url = UriComponentsBuilder
                .fromUriString(sslBaseUrl + "/validator/api/validationserverAPI.php")
                .queryParam("val_id", valId)
                .queryParam("store_id", storeId)
                .queryParam("store_passwd", storePassword)
                .queryParam("v", "1")
                .queryParam("format", "json")
                .build(true)
                .toUriString();

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            return response.getBody();
        } catch (HttpStatusCodeException ex) {
            throw new BadRequestException("SSLCOMMERZ validation request failed: " + sanitizeErrorBody(ex.getResponseBodyAsString()));
        } catch (RestClientException ex) {
            throw new BadRequestException("Unable to connect to SSLCOMMERZ validation API");
        }
    }

    private boolean isValidationSuccess(Map<String, Object> validationResponse, Payment payment) {
        if (validationResponse == null) {
            return false;
        }

        String status = getString(validationResponse, "status");
        if (!("VALID".equalsIgnoreCase(status) || "VALIDATED".equalsIgnoreCase(status))) {
            return false;
        }

        String responseTranId = getString(validationResponse, "tran_id");
        if (!payment.getTransactionId().equals(responseTranId)) {
            return false;
        }

        double paidAmount = parseAmount(getString(validationResponse, "amount"));
        double expectedAmount;
        if (payment.getPaidAmount() == null) {
            expectedAmount = payment.getAmount();
        } else {
            expectedAmount = payment.getPaidAmount();
        }

        return amountsMatch(paidAmount, expectedAmount);
    }

    private boolean hasMinimumRequiredPayment(Payment payment) {
        if (payment.getTotalAmount() == null || payment.getPaidAmount() == null) {
            return false;
        }

        if (Boolean.TRUE.equals(payment.getIsPartial())) {
            return payment.getPaidAmount() + 0.009 >= calculateAdvanceAmount(payment.getTotalAmount());
        }

        return payment.getPaidAmount() > 0;
    }

    private boolean isPaidStatus(PaymentStatus status) {
        return status == PaymentStatus.SUCCESS || status == PaymentStatus.PARTIAL || status == PaymentStatus.FULL;
    }

    private boolean isPendingPaymentStale(Payment payment) {
        return payment.getCreatedAt() != null
                && payment.getCreatedAt().isBefore(LocalDateTime.now().minusMinutes(PENDING_PAYMENT_TIMEOUT_MINUTES));
    }

    private PaymentCallbackResultResponse buildCallbackResponse(String status, String message, Payment payment, Booking booking) {
        String bookingPaymentStatus = null;
        if (booking.getPaymentStatus() != null) {
            bookingPaymentStatus = booking.getPaymentStatus().name();
        }

        return new PaymentCallbackResultResponse(
                status,
                message,
                payment.getTransactionId(),
                booking.getId(),
                booking.getTotalAmount(),
                booking.getPaidAmount(),
                booking.getDueAmount(),
                bookingPaymentStatus
        );
    }

    private Payment findPaymentByTransactionId(String transactionId) {
        if (isBlank(transactionId)) {
            return null;
        }
        return paymentRepository.findByTransactionId(transactionId).orElse(null);
    }

    private String generateTransactionId() {
        for (int i = 0; i < 10; i++) {
            String candidate = "TXN-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"))
                    + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
            if (!paymentRepository.existsByTransactionId(candidate)) {
                return candidate;
            }
        }
        throw new BadRequestException("Unable to generate unique transaction id. Please try again.");
    }

    private String sanitizeErrorBody(String body) {
        if (isBlank(body)) {
            return "HTTP error";
        }

        if (body.length() > 400) {
            return body.substring(0, 400);
        }
        return body;
    }

    private String safeValue(String value, String fallback) {
        if (isBlank(value)) {
            return fallback;
        }
        return value;
    }

    private boolean amountsMatch(double paidAmount, double expectedAmount) {
        if (paidAmount < 0 || expectedAmount < 0) {
            return false;
        }
        return Math.abs(paidAmount - expectedAmount) < 0.01;
    }

    private double parseAmount(String amountText) {
        if (isBlank(amountText)) {
            return -1;
        }
        try {
            return Double.parseDouble(amountText.trim());
        } catch (NumberFormatException ex) {
            return -1;
        }
    }

    private String getString(Map<String, Object> source, String key) {
        if (source == null || source.get(key) == null) {
            return null;
        }
        return String.valueOf(source.get(key));
    }

    private String toJson(Map<String, Object> source) {
        if (source == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(source);
        } catch (JsonProcessingException ex) {
            return source.toString();
        }
    }

    private String formatAmount(Double amount) {
        return String.format("%.2f", amount);
    }

    private double calculateAdvanceAmount(double totalAmount) {
        return roundAmount(totalAmount * 0.50);
    }

    private double roundAmount(double amount) {
        return Math.round(amount * 100.0) / 100.0;
    }

    private void validateSslConfig() {
        if (isBlank(sslBaseUrl) || isBlank(storeId) || isBlank(storePassword)) {
            throw new BadRequestException("SSLCOMMERZ is not configured. Please set SSLCOMMERZ_BASE_URL, SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD");
        }
        if (isBlank(successUrl) || isBlank(failUrl) || isBlank(cancelUrl)) {
            throw new BadRequestException("SSLCOMMERZ callback URLs are not configured");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
