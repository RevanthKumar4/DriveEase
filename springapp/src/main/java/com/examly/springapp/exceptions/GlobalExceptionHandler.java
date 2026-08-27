package com.examly.springapp.exceptions;

import jakarta.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ===== Domain Exceptions =====

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(
            UserNotFoundException ex, HttpServletRequest request) {
        log.warn("User not found: {}", ex.getMessage());
        return buildResponse(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", ex.getMessage(), request);
    }

    @ExceptionHandler(DriverNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleDriverNotFound(
            DriverNotFoundException ex, HttpServletRequest request) {
        log.warn("Driver not found: {}", ex.getMessage());
        return buildResponse(HttpStatus.NOT_FOUND, "DRIVER_NOT_FOUND", ex.getMessage(), request);
    }

    @ExceptionHandler(DuplicateUserException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateUser(
            DuplicateUserException ex, HttpServletRequest request) {
        log.warn("Duplicate user registration attempt: {}", ex.getMessage());
        return buildResponse(HttpStatus.CONFLICT, "DUPLICATE_USER", ex.getMessage(), request);
    }

    @ExceptionHandler(InvalidOtpException.class)
    public ResponseEntity<ErrorResponse> handleInvalidOtp(
            InvalidOtpException ex, HttpServletRequest request) {
        // Do NOT log OTP values
        log.warn("OTP validation failed at {}", request.getRequestURI());
        return buildResponse(HttpStatus.BAD_REQUEST, "INVALID_OTP", ex.getMessage(), request);
    }

    @ExceptionHandler(PaymentVerificationException.class)
    public ResponseEntity<ErrorResponse> handlePaymentVerification(
            PaymentVerificationException ex, HttpServletRequest request) {
        log.error("Payment verification failed at {}", request.getRequestURI());
        return buildResponse(HttpStatus.BAD_REQUEST, "PAYMENT_VERIFICATION_FAILED", ex.getMessage(), request);
    }

    @ExceptionHandler(DriverDeletionException.class)
    public ResponseEntity<ErrorResponse> handleDriverDeletion(
            DriverDeletionException ex, HttpServletRequest request) {
        log.warn("Driver deletion failed: {}", ex.getMessage());
        return buildResponse(HttpStatus.CONFLICT, "DRIVER_DELETION_FAILED", ex.getMessage(), request);
    }

    @ExceptionHandler(DriverRequestDeletionException.class)
    public ResponseEntity<ErrorResponse> handleDriverRequestDeletion(
            DriverRequestDeletionException ex, HttpServletRequest request) {
        log.warn("Driver request deletion failed: {}", ex.getMessage());
        return buildResponse(HttpStatus.CONFLICT, "REQUEST_DELETION_FAILED", ex.getMessage(), request);
    }

    @ExceptionHandler(DuplicateDriverException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateDriver(
            DuplicateDriverException ex, HttpServletRequest request) {
        log.warn("Duplicate driver: {}", ex.getMessage());
        return buildResponse(HttpStatus.CONFLICT, "DUPLICATE_DRIVER", ex.getMessage(), request);
    }

    // ===== Validation =====

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        log.debug("Validation failed at {}: {}", request.getRequestURI(), message);
        return buildResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message, request);
    }

    // ===== Security =====

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {
        log.warn("Access denied to {}: {}", request.getRequestURI(), ex.getMessage());
        return buildResponse(HttpStatus.FORBIDDEN, "ACCESS_DENIED",
                "You do not have permission to perform this action", request);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(
            AuthenticationException ex, HttpServletRequest request) {
        log.debug("Authentication failed at {}", request.getRequestURI());
        return buildResponse(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_REQUIRED",
                "Authentication is required to access this resource", request);
    }

    // ===== Generic Fallback =====

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntime(
            RuntimeException ex, HttpServletRequest request) {
        // Log with stack trace but never expose details to client
        log.error("Unexpected error at {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                "An unexpected error occurred. Please try again.", request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(
            Exception ex, HttpServletRequest request) {
        log.error("Unexpected exception at {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                "An unexpected error occurred. Please try again.", request);
    }

    // ===== Helper =====

    private ResponseEntity<ErrorResponse> buildResponse(
            HttpStatus status, String error, String message, HttpServletRequest request) {
        ErrorResponse body = new ErrorResponse(
            status.value(), error, message, request.getRequestURI()
        );
        return ResponseEntity.status(status).body(body);
    }
}
