package com.turfexplorer.controller;

import com.turfexplorer.dto.ChatRequest;
import com.turfexplorer.entity.Turf;
import com.turfexplorer.enums.BookingStatus;
import com.turfexplorer.enums.ChatIntent;
import com.turfexplorer.enums.PaymentStatus;
import com.turfexplorer.enums.Role;
import com.turfexplorer.enums.TurfStatus;
import com.turfexplorer.repository.BookingRepository;
import com.turfexplorer.repository.PaymentRepository;
import com.turfexplorer.repository.TurfRepository;
import com.turfexplorer.repository.UserRepository;
import com.turfexplorer.service.DistanceService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    private static final Pattern BUDGET_PATTERN = Pattern.compile("(?:under|below)\\s*(?:tk|taka|bdt|৳)?\\s*(\\d+(?:\\.\\d+)?)|within\\s*(?:tk|taka|bdt|৳)\\s*(\\d+(?:\\.\\d+)?)", Pattern.CASE_INSENSITIVE);
    private static final Pattern RADIUS_PATTERN = Pattern.compile("(?:within|in)\\s*(\\d+(?:\\.\\d+)?)\\s*km", Pattern.CASE_INSENSITIVE);

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final TurfRepository turfRepository;
    private final UserRepository userRepository;
    private final DistanceService distanceService;

    private final Map<String, ChatIntent> lastIntentBySession = new ConcurrentHashMap<>();

    public ChatController(
            BookingRepository bookingRepository,
            PaymentRepository paymentRepository,
            TurfRepository turfRepository,
            UserRepository userRepository,
            DistanceService distanceService
    ) {
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.turfRepository = turfRepository;
        this.userRepository = userRepository;
        this.distanceService = distanceService;
    }

    @PostMapping
    public Map<String, String> chat(@RequestBody ChatRequest request) {
        String message = safeValue(request.getMessage(), "").trim();
        String sessionId = safeValue(request.getSessionId(), UUID.randomUUID().toString());
        String userRole = safeValue(request.getUserRole(), "guest").trim().toLowerCase(Locale.ROOT);
        String userName = safeValue(request.getUserName(), "friend").trim();

        if (message.isBlank()) {
            return Map.of(
                    "reply",
                    "Hi " + safeName(userName) + "! I can help with booking, payment, owner/admin actions, and live platform stats."
            );
        }

        String q = message.toLowerCase(Locale.ROOT);
        ChatIntent intent = detectIntent(q, sessionId);
        lastIntentBySession.put(sessionId, intent);

        if (intent == ChatIntent.STATS) {
            long totalTurfs = turfRepository.count();
            long approvedTurfs = turfRepository.countByStatus(TurfStatus.APPROVED);
            long pendingTurfs = turfRepository.countByStatus(TurfStatus.PENDING);
            long totalBookings = bookingRepository.count();
            long confirmedBookings = bookingRepository.countByStatus(BookingStatus.CONFIRMED);
            long pendingPayments = paymentRepository.countByStatus(PaymentStatus.PENDING);
                long successPayments = paymentRepository.countByStatus(PaymentStatus.SUCCESS)
                    + paymentRepository.countByStatus(PaymentStatus.PARTIAL)
                    + paymentRepository.countByStatus(PaymentStatus.FULL);

            String statsReply = "Live snapshot: turfs " + approvedTurfs + "/" + totalTurfs
                    + " approved, " + pendingTurfs + " pending approval; bookings " + confirmedBookings
                    + "/" + totalBookings + " confirmed; payments " + successPayments
                    + " success, " + pendingPayments + " pending.";

            return Map.of("reply", statsReply);
        }

        if (intent == ChatIntent.BOOKING) {
            long totalBookings = bookingRepository.count();
            long confirmed = bookingRepository.countByStatus(BookingStatus.CONFIRMED);
            return Map.of(
                    "reply",
                    "To book: open Turfs, pick turf/date/slot, then Pay Now. Booking confirms only after payment verification."
                            + " Current confirmation trend: " + confirmed + " of " + totalBookings + " bookings are confirmed."
            );
        }

        if (intent == ChatIntent.PAYMENT) {
            long success = paymentRepository.countByStatus(PaymentStatus.SUCCESS)
                    + paymentRepository.countByStatus(PaymentStatus.PARTIAL)
                    + paymentRepository.countByStatus(PaymentStatus.FULL);
            long failed = paymentRepository.countByStatus(PaymentStatus.FAILED);
            long cancelled = paymentRepository.countByStatus(PaymentStatus.CANCELLED);
            long pending = paymentRepository.countByStatus(PaymentStatus.PENDING);
            return Map.of(
                    "reply",
                    "Payment flow: Pay Now -> gateway redirect -> callback/verify -> booking confirmation only on success."
                            + " Live payment status totals: success " + success
                            + ", failed " + failed
                            + ", cancelled " + cancelled
                            + ", pending " + pending + "."
            );
        }

        if (intent == ChatIntent.CANCEL) {
            return Map.of("reply", "You can cancel from My Bookings. Open My Bookings, find your booking, and click Cancel.");
        }

        if (intent == ChatIntent.LOGIN) {
            return Map.of("reply", "Click Login in the header, then enter your registered email and password.");
        }

        if (intent == ChatIntent.REGISTER) {
            return Map.of("reply", "Click Register/Sign Up from the header and create your Turf Explorer account.");
        }

        if (intent == ChatIntent.OWNER) {
            long totalOwners = userRepository.countByRole(Role.OWNER);
            long pendingTurfs = turfRepository.countByStatus(TurfStatus.PENDING);
            return Map.of(
                    "reply",
                    "Owner flow: Add Turf -> wait for admin approval -> manage slots/prices in My Turfs."
                            + " There are currently " + totalOwners + " owner accounts and " + pendingTurfs
                            + " turfs waiting for approval."
            );
        }

        if (intent == ChatIntent.ADMIN) {
            long pendingTurfs = turfRepository.countByStatus(TurfStatus.PENDING);
            long approvedTurfs = turfRepository.countByStatus(TurfStatus.APPROVED);
            return Map.of(
                    "reply",
                    "Admin flow: review turfs in Admin Dashboard and approve/reject."
                            + " Queue now: " + pendingTurfs + " pending, " + approvedTurfs + " approved total."
            );
        }

        if (intent == ChatIntent.PRICING) {
            return Map.of("reply", "Pricing is defined by slot. Final payable amount comes from the selected slot price.");
        }

        if (intent == ChatIntent.STATUS) {
            long confirmed = bookingRepository.countByStatus(BookingStatus.CONFIRMED);
            long pending = bookingRepository.countByStatus(BookingStatus.PENDING);
            long cancelled = bookingRepository.countByStatus(BookingStatus.CANCELLED);
            return Map.of(
                    "reply",
                    "Booking status updates after payment verification."
                            + " Current totals: confirmed " + confirmed
                            + ", pending " + pending
                            + ", cancelled " + cancelled + "."
            );
        }

        if (intent == ChatIntent.SUPPORT) {
            String roleHint;
            if ("admin".equals(userRole)) {
                roleHint = "As admin, you can cross-check payment and booking records from dashboard APIs.";
            } else if ("owner".equals(userRole)) {
                roleHint = "As owner, verify your turf/slot settings and share booking id with support.";
            } else {
                roleHint = "Share booking id and transaction id with support for fastest resolution.";
            }

            String supportReply = "For support, share your booking id and transaction id with admin/project owner for quick troubleshooting. " + roleHint;
            return Map.of("reply", supportReply);
        }

        if (intent == ChatIntent.GREETING) {
            return Map.of("reply", "Hello " + safeName(userName) + "! Ask me anything about booking, payments, admin/owner flow, or type 'stats' for live platform numbers.");
        }

        if (intent == ChatIntent.FIND_BEST_TURF) {
            return handleFindBestTurf(request, q);
        }

        return Map.of(
                "reply",
                "I can help with booking, payment, cancel, login/register, owner/admin tasks, pricing, and live stats."
                        + " Try asking: 'show stats' or 'why booking pending?'."
        );
    }

    private ChatIntent detectIntent(String q, String sessionId) {
        ChatIntent lastIntent = lastIntentBySession.getOrDefault(sessionId, ChatIntent.GENERAL);

        if (containsAny(q, "hi", "hello", "hey")) return ChatIntent.GREETING;
        if (containsAny(q, "stats", "summary", "overall", "dashboard")) return ChatIntent.STATS;
        if (containsAny(q, "book", "booking", "reserve", "slot")) return ChatIntent.BOOKING;
        if (containsAny(q, "payment", "pay", "gateway", "transaction", "success", "failed")) return ChatIntent.PAYMENT;
        if (containsAny(q, "cancel", "refund")) return ChatIntent.CANCEL;
        if (containsAny(q, "login", "sign in")) return ChatIntent.LOGIN;
        if (containsAny(q, "register", "signup", "sign up", "create account")) return ChatIntent.REGISTER;
        if (containsAny(q, "owner", "add turf", "my turfs", "slot management")) return ChatIntent.OWNER;
        if (containsAny(q, "admin", "approve", "approval", "reject")) return ChatIntent.ADMIN;
        if (containsAny(q, "price", "pricing", "cost", "amount")) return ChatIntent.PRICING;
        if (containsAny(q, "status", "confirmed", "not confirmed", "pending")) return ChatIntent.STATUS;
        if (containsAny(q, "support", "help", "contact")) return ChatIntent.SUPPORT;
        if (containsAny(
                q,
                "best turf",
                "cheap turf",
                "affordable turf",
                "turf under",
                "turf below",
                "turf within",
                "best turf near",
                "nearby turf"
        )) {
            return ChatIntent.FIND_BEST_TURF;
        }

        if (containsAny(q, "that", "this", "it", "what about", "and then")) {
            return lastIntent;
        }

        return ChatIntent.GENERAL;
    }

    private Map<String, String> handleFindBestTurf(ChatRequest request, String message) {
        if (request.getLatitude() == null || request.getLongitude() == null) {
            return Map.of("reply", "Please enable location to find nearby turfs");
        }

        List<Turf> approvedTurfs = turfRepository.findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNull(TurfStatus.APPROVED);
        if (approvedTurfs.isEmpty()) {
            return Map.of("reply", "No turfs found within your budget nearby");
        }

        boolean nearbyIntent = containsAny(message, "near me", "nearby", "nearest", "close to me");
        Double parsedBudget = extractBudget(message);
        Double maxRadiusKm = extractRadiusKm(message);
        if (nearbyIntent && maxRadiusKm == null) {
            maxRadiusKm = 5.0;
        }

        double maxPriceFilter = Double.MAX_VALUE;
        if (parsedBudget != null) {
            maxPriceFilter = parsedBudget;
        }

        double scoringBudget;
        if (parsedBudget == null) {
            double maxObservedPrice = 0.0;
            for (Turf turf : approvedTurfs) {
                Double turfPrice = turf.getPricePerHour();
                if (turfPrice != null && turfPrice > maxObservedPrice) {
                    maxObservedPrice = turfPrice;
                }
            }
            if (maxObservedPrice <= 0.0) {
                scoringBudget = 1.0;
            } else {
                scoringBudget = maxObservedPrice;
            }
        } else {
            scoringBudget = parsedBudget;
        }

        if (scoringBudget <= 0) {
            scoringBudget = 1.0;
        }

        List<TurfRecommendation> candidates = new ArrayList<>();
        for (Turf turf : approvedTurfs) {
            if (turf.getPricePerHour() == null || turf.getPricePerHour() > maxPriceFilter) {
                continue;
            }

            Double distanceKm = distanceService.calculateDistance(
                    request.getLatitude(),
                    request.getLongitude(),
                    turf.getLatitude(),
                    turf.getLongitude()
            );
            if (distanceKm == null) {
                continue;
            }

            if (maxRadiusKm != null && distanceKm > maxRadiusKm) {
                continue;
            }

            double score = (distanceKm * 0.7) + ((turf.getPricePerHour() / scoringBudget) * 0.3);
            candidates.add(new TurfRecommendation(turf, distanceKm, score));
        }

        if (candidates.isEmpty()) {
            return Map.of("reply", "No turfs found within your budget nearby");
        }

        candidates.sort(new Comparator<TurfRecommendation>() {
            @Override
            public int compare(TurfRecommendation first, TurfRecommendation second) {
                int scoreCompare = Double.compare(first.getScore(), second.getScore());
                if (scoreCompare != 0) {
                    return scoreCompare;
                }

                int distanceCompare = Double.compare(first.getDistanceKm(), second.getDistanceKm());
                if (distanceCompare != 0) {
                    return distanceCompare;
                }

                double firstPrice = 0.0;
                if (first.getTurf().getPricePerHour() != null) {
                    firstPrice = first.getTurf().getPricePerHour();
                }

                double secondPrice = 0.0;
                if (second.getTurf().getPricePerHour() != null) {
                    secondPrice = second.getTurf().getPricePerHour();
                }

                int priceCompare = Double.compare(firstPrice, secondPrice);
                if (priceCompare != 0) {
                    return priceCompare;
                }

                String firstName = safeValue(first.getTurf().getName(), "");
                String secondName = safeValue(second.getTurf().getName(), "");
                return firstName.compareTo(secondName);
            }
        });

        int requestedResultCount;
        if (maxRadiusKm != null || nearbyIntent) {
            requestedResultCount = 1;
        } else {
            requestedResultCount = 3;
        }
        int resultCount = Math.min(requestedResultCount, candidates.size());

        StringBuilder reply = new StringBuilder();
        if (maxRadiusKm != null) {
            reply.append("Here is the best turf for you within ")
                    .append(String.format(Locale.US, "%.1f", maxRadiusKm))
                    .append(" km:\n\n");
        } else {
            reply.append("Here are the best turfs for you:\n\n");
        }

        for (int i = 0; i < resultCount; i++) {
            TurfRecommendation rec = candidates.get(i);
            reply.append(i + 1)
                    .append(". ")
                    .append(safeValue(rec.getTurf().getName(), "Turf"))
                    .append(" - ৳")
                    .append(formatAmount(rec.getTurf().getPricePerHour()))
                    .append("/hr - ")
                    .append(String.format(Locale.US, "%.1f", rec.getDistanceKm()))
                    .append(" km away");

            if (i < resultCount - 1) {
                reply.append("\n");
            }
        }

        return Map.of("reply", reply.toString());
    }

    private Double extractBudget(String message) {
        Matcher matcher = BUDGET_PATTERN.matcher(message);
        if (!matcher.find()) {
            return null;
        }

        try {
            String value = matcher.group(1);
            if (value == null) {
                value = matcher.group(2);
            }

            if (value == null) {
                return null;
            }

            return Double.parseDouble(value);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Double extractRadiusKm(String message) {
        Matcher matcher = RADIUS_PATTERN.matcher(message);
        if (!matcher.find()) {
            return null;
        }

        try {
            return Double.parseDouble(matcher.group(1));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String formatAmount(Double amount) {
        if (amount == null) {
            return "0";
        }
        if (amount % 1 == 0) {
            return String.valueOf(amount.longValue());
        }
        return String.format(Locale.US, "%.2f", amount);
    }

    private String safeValue(String value, String fallback) {
        if (value == null) {
            return fallback;
        }
        return value;
    }

    private boolean containsAny(String source, String... terms) {
        for (String term : terms) {
            if (source.contains(term)) {
                return true;
            }
        }
        return false;
    }

    private String safeName(String userName) {
        if (userName == null || userName.isBlank()) {
            return "there";
        }
        return userName;
    }

    private static class TurfRecommendation {
        private final Turf turf;
        private final double distanceKm;
        private final double score;

        private TurfRecommendation(Turf turf, double distanceKm, double score) {
            this.turf = turf;
            this.distanceKm = distanceKm;
            this.score = score;
        }

        public Turf getTurf() {
            return turf;
        }

        public double getDistanceKm() {
            return distanceKm;
        }

        public double getScore() {
            return score;
        }
    }
}
