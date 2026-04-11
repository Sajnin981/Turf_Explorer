package com.turfexplorer.service;

import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import com.turfexplorer.dto.PaymentCreateSessionResponse;
import com.turfexplorer.dto.PaymentSuccessResponse;
import com.turfexplorer.entity.Booking;
import com.turfexplorer.entity.Slot;
import com.turfexplorer.entity.Transaction;
import com.turfexplorer.enums.BookingStatus;
import com.turfexplorer.enums.TransactionStatus;
import com.turfexplorer.exception.BadRequestException;
import com.turfexplorer.exception.ResourceNotFoundException;
import com.turfexplorer.repository.BookingRepository;
import com.turfexplorer.repository.SlotRepository;
import com.turfexplorer.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private SlotRepository slotRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Value("${stripe.secret.key:}")
    private String stripeSecretKey;

    @Value("${stripe.webhook.secret:}")
    private String stripeWebhookSecret;

    @Value("${stripe.currency:bdt}")
    private String stripeCurrency;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Transactional
    public PaymentCreateSessionResponse createCheckoutSession(Long userId, Long bookingId) {
        log.info("Stripe checkout session request received for bookingId={} userId={}", bookingId, userId);
        ensureStripeSecretConfigured();
        log.info("Stripe API key configured: {}", maskSecret(stripeSecretKey));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (!booking.getUserId().equals(userId)) {
            throw new BadRequestException("You can only pay for your own bookings");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Cancelled bookings cannot be paid");
        }

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            throw new BadRequestException("Booking is already confirmed");
        }

        Slot slot = slotRepository.findById(booking.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));

        Stripe.apiKey = stripeSecretKey;

        try {
            double bookingAmount = slot.getPrice();
            long amountInMinorUnit = BigDecimal.valueOf(bookingAmount)
                .multiply(BigDecimal.valueOf(100L))
                .setScale(0, RoundingMode.HALF_UP)
                .longValue();
            String amountAsText = BigDecimal.valueOf(bookingAmount)
                .setScale(2, RoundingMode.HALF_UP)
                .toPlainString();

            log.info("Stripe amount conversion bookingId={} amountBDT={} amountMinorUnit={} currency={}",
                booking.getId(), amountAsText, amountInMinorUnit, stripeCurrency);
            log.info("Creating Stripe checkout session for bookingId={} amount={} currency={} successUrl={} cancelUrl={}",
                booking.getId(), amountInMinorUnit, stripeCurrency,
            frontendUrl + "/success?session_id={CHECKOUT_SESSION_ID}",
                frontendUrl + "/payment-failed?bookingId=" + booking.getId());

            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(frontendUrl + "/success?session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(frontendUrl + "/payment-failed?bookingId=" + booking.getId())
                .putMetadata("booking_id", booking.getId().toString())
                .putMetadata("amount", amountAsText)
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency(stripeCurrency.toLowerCase())
                                                    .setUnitAmount(amountInMinorUnit)
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName("Turf Booking")
                                                                    .build()
                                                    )
                                                    .build()
                                    )
                                    .build()
                    )
                    .build();

            Session session = Session.create(params);

            Transaction transaction = new Transaction();
            transaction.setBookingId(booking.getId());
            transaction.setAmount(bookingAmount);
            transaction.setStatus(TransactionStatus.PENDING);
            transaction.setStripeSessionId(session.getId());
            transactionRepository.save(transaction);

            log.info("Stripe checkout session created successfully for bookingId={} sessionId={}", booking.getId(), session.getId());
            return new PaymentCreateSessionResponse(session.getUrl());
        } catch (StripeException ex) {
            log.error("Stripe checkout session creation failed for bookingId={} userId={}: {}", bookingId, userId, ex.getMessage(), ex);
            throw new BadRequestException("Failed to create Stripe checkout session: " + ex.getMessage());
        }
    }

    @Transactional
    public void handleWebhook(String payload, String signatureHeader) {
        ensureStripeSecretConfigured();

        if (!StringUtils.hasText(stripeWebhookSecret)) {
            throw new BadRequestException("Stripe webhook secret is not configured");
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, signatureHeader, stripeWebhookSecret);
        } catch (SignatureVerificationException ex) {
            throw new BadRequestException("Invalid Stripe webhook signature");
        }

        if (!"checkout.session.completed".equals(event.getType())) {
            return;
        }

        Session session = (Session) event.getDataObjectDeserializer()
                .getObject()
                .orElseThrow(() -> new BadRequestException("Could not deserialize Stripe session"));

        markPaymentSuccess(session.getId());
    }

    private void ensureStripeSecretConfigured() {
        if (!StringUtils.hasText(stripeSecretKey)) {
            throw new BadRequestException("Stripe secret key is not configured");
        }
        if (!stripeSecretKey.startsWith("sk_test_") && !stripeSecretKey.startsWith("sk_live_")) {
            log.warn("Stripe secret key does not use a standard Stripe prefix");
        }
    }

    private String maskSecret(String secret) {
        if (!StringUtils.hasText(secret)) {
            return "<empty>";
        }
        int visiblePrefix = Math.min(8, secret.length());
        int visibleSuffix = Math.min(4, Math.max(secret.length() - visiblePrefix, 0));
        if (secret.length() <= visiblePrefix + visibleSuffix) {
            return secret.charAt(0) + "***" + secret.charAt(secret.length() - 1);
        }
        return secret.substring(0, visiblePrefix) + "..." + secret.substring(secret.length() - visibleSuffix);
    }

    private Transaction markPaymentSuccess(String stripeSessionId) {
        Transaction transaction = transactionRepository.findByStripeSessionId(stripeSessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found for Stripe session"));

        log.info("Found transaction for success handling: id={} bookingId={} amount={} status={} sessionId={}",
                transaction.getId(), transaction.getBookingId(), transaction.getAmount(), transaction.getStatus(), stripeSessionId);

        if (transaction.getStatus() == TransactionStatus.SUCCESS) {
            return transaction;
        }

        Booking booking = bookingRepository.findById(transaction.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found for transaction"));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            return transaction;
        }

        boolean slotAlreadyConfirmedByAnotherBooking = bookingRepository
                .findBySlotIdAndBookingDateAndStatus(booking.getSlotId(), booking.getBookingDate(), BookingStatus.CONFIRMED)
                .filter(existing -> !existing.getId().equals(booking.getId()))
                .isPresent();

        if (slotAlreadyConfirmedByAnotherBooking) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            return transaction;
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        transaction.setStatus(TransactionStatus.SUCCESS);
        transactionRepository.save(transaction);

        log.info("Payment confirmed successfully for stripeSessionId={} bookingId={}", stripeSessionId, booking.getId());
        return transaction;
    }

    @Transactional
    public PaymentSuccessResponse confirmPaymentSuccess(String stripeSessionId) {
        log.info("Payment success confirmation received from frontend for sessionId={}", stripeSessionId);

        if (!StringUtils.hasText(stripeSessionId)) {
            log.error("Empty or null sessionId provided to confirmPaymentSuccess");
            throw new BadRequestException("Session ID is required");
        }

        Transaction transaction = transactionRepository.findByStripeSessionId(stripeSessionId)
                .orElseThrow(() -> {
                    log.error("Transaction not found for stripeSessionId={}", stripeSessionId);
                    return new ResourceNotFoundException("Transaction not found for this payment session");
                });

        log.info("Found transaction: id={} bookingId={} status={}", transaction.getId(), transaction.getBookingId(), transaction.getStatus());

        if (transaction.getStatus() == TransactionStatus.SUCCESS) {
            log.info("Transaction already marked as SUCCESS for sessionId={}, skipping", stripeSessionId);
            Booking existingBooking = bookingRepository.findById(transaction.getBookingId())
                    .orElseThrow(() -> new ResourceNotFoundException("Booking not found for transaction"));
            return new PaymentSuccessResponse(transaction.getAmount(), transaction.getStatus().name(), existingBooking.getStatus().name());
        }

        Transaction updatedTransaction = markPaymentSuccess(stripeSessionId);
        Booking updatedBooking = bookingRepository.findById(updatedTransaction.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found for transaction"));
        log.info("Payment confirmation completed for sessionId={}", stripeSessionId);
        return new PaymentSuccessResponse(updatedTransaction.getAmount(), updatedTransaction.getStatus().name(), updatedBooking.getStatus().name());
    }
}
