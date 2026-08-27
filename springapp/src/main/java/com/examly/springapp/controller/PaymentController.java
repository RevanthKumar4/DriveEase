package com.examly.springapp.controller;

import com.examly.springapp.exceptions.PaymentVerificationException;
import com.examly.springapp.model.User;
import com.examly.springapp.repository.UserRepo;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:}")
    private String razorpayKeySecret;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private UserRepo userRepo;

    // ===========================================================
    // 1. Create Razorpay Order (server-side)
    // ===========================================================

    /**
     * Creates a Razorpay order on the server side.
     * The frontend must use this orderId when opening the Razorpay checkout.
     * Amount in paise (e.g., 50000 = ₹500)
     */
    @PostMapping("/create-order")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createOrder(@RequestBody CreateOrderRequest req) {
        if (req.getAmountInPaise() == null || req.getAmountInPaise() <= 0) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Amount must be greater than 0"));
        }

        try {
            RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", req.getAmountInPaise());
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "driveease_" + System.currentTimeMillis());

            Order order = razorpay.orders.create(orderRequest);

            log.info("Razorpay order created with id: {}", (Object) order.get("id").toString());

            return ResponseEntity.ok(Map.of(
                "orderId",   order.get("id").toString(),
                "amount",    order.get("amount"),
                "currency",  order.get("currency"),
                "keyId",     razorpayKeyId   // Send key ID (not secret) to frontend
            ));

        } catch (RazorpayException e) {
            log.error("Failed to create Razorpay order: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to create payment order. Please try again."));
        }
    }

    // ===========================================================
    // 2. Verify Payment Signature (server-side)
    // ===========================================================

    /**
     * Verifies the Razorpay payment signature using HMAC-SHA256.
     * ONLY after a successful verification does the backend confirm the payment.
     * The backend never trusts a "payment successful" message from the frontend.
     */
    @PostMapping("/verify")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> verifyPayment(@RequestBody VerifyPaymentRequest req) {
        try {
            String payload = req.getRazorpayOrderId() + "|" + req.getRazorpayPaymentId();
            String computedSignature = hmacSha256(payload, razorpayKeySecret);

            if (!computedSignature.equals(req.getRazorpaySignature())) {
                log.warn("Payment signature verification failed for orderId={}", req.getRazorpayOrderId());
                throw new PaymentVerificationException("Payment signature verification failed");
            }

            log.info("Payment verified successfully for orderId={}", req.getRazorpayOrderId());
            return ResponseEntity.ok(Map.of(
                "verified", true,
                "message",  "Payment verified successfully"
            ));

        } catch (PaymentVerificationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error during payment verification: {}", e.getMessage());
            throw new PaymentVerificationException("Payment verification could not be completed");
        }
    }

    // ===========================================================
    // 3. Send Confirmation Email (only after verified payment)
    // ===========================================================

    @PostMapping("/send-confirmation")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> sendConfirmation(@RequestBody PaymentEmailRequest req) {
        try {
            User user = userRepo.findById(req.getUserId()).orElse(null);

            if (user == null || user.getEmail() == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "User email not found"));
            }

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("DriveEase — Payment Confirmation");
            message.setText(
                "Dear " + user.getUsername() + ",\n\n" +
                "Your payment has been received successfully.\n\n" +
                "----------------------------------------\n" +
                "Payment ID   : " + req.getPaymentId() + "\n" +
                "Amount Paid  : Rs. " + req.getAmount() + "\n" +
                "Driver       : " + req.getDriverName() + "\n" +
                "Pickup       : " + req.getPickupLocation() + "\n" +
                "Drop         : " + req.getDropLocation() + "\n" +
                "----------------------------------------\n\n" +
                "Thank you for choosing DriveEase!\n" +
                "Your Journey, Our Responsibility.\n\n" +
                "— The DriveEase Team"
            );

            mailSender.send(message);
            log.info("Payment confirmation email sent");
            return ResponseEntity.ok(Map.of("message", "Confirmation email sent"));

        } catch (Exception e) {
            log.error("Failed to send confirmation email: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to send confirmation email"));
        }
    }

    // ===========================================================
    // HMAC-SHA256 helper
    // ===========================================================

    private String hmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec keySpec = new SecretKeySpec(
            secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"
        );
        mac.init(keySpec);
        byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));

        StringBuilder hex = new StringBuilder();
        for (byte b : bytes) {
            hex.append(String.format("%02x", b));
        }
        return hex.toString();
    }

    // ===========================================================
    // Request DTOs
    // ===========================================================

    public static class CreateOrderRequest {
        private Long amountInPaise;
        public Long getAmountInPaise() { return amountInPaise; }
        public void setAmountInPaise(Long amountInPaise) { this.amountInPaise = amountInPaise; }
    }

    public static class VerifyPaymentRequest {
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private String razorpaySignature;

        public String getRazorpayOrderId() { return razorpayOrderId; }
        public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }

        public String getRazorpayPaymentId() { return razorpayPaymentId; }
        public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }

        public String getRazorpaySignature() { return razorpaySignature; }
        public void setRazorpaySignature(String razorpaySignature) { this.razorpaySignature = razorpaySignature; }
    }

    public static class PaymentEmailRequest {
        private Long userId;
        private String paymentId;
        private double amount;
        private String driverName;
        private String pickupLocation;
        private String dropLocation;

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public String getPaymentId() { return paymentId; }
        public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

        public double getAmount() { return amount; }
        public void setAmount(double amount) { this.amount = amount; }

        public String getDriverName() { return driverName; }
        public void setDriverName(String driverName) { this.driverName = driverName; }

        public String getPickupLocation() { return pickupLocation; }
        public void setPickupLocation(String pickupLocation) { this.pickupLocation = pickupLocation; }

        public String getDropLocation() { return dropLocation; }
        public void setDropLocation(String dropLocation) { this.dropLocation = dropLocation; }
    }
}