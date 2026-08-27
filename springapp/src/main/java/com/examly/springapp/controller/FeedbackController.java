package com.examly.springapp.controller;

import com.examly.springapp.model.Feedback;
import com.examly.springapp.service.FeedbackService;

import jakarta.validation.Valid;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class FeedbackController {

    private static final Logger log = LoggerFactory.getLogger(FeedbackController.class);

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    /** Authenticated users can post feedback */
    @PostMapping("/feedback")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Feedback> createFeedback(@Valid @RequestBody Feedback feedback) {
        try {
            Feedback createdFeedback = feedbackService.createFeedback(feedback);
            log.info("Feedback created");
            return ResponseEntity.status(201).body(createdFeedback);
        } catch (Exception e) {
            return ResponseEntity.status(409).build();
        }
    }

    /** Authenticated — view single feedback */
    @GetMapping("/feedback/{feedbackId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Feedback> getFeedbackById(@PathVariable Long feedbackId) {
        try {
            Feedback feedback = feedbackService.getFeedbackById(feedbackId);
            if (feedback != null) {
                return ResponseEntity.status(200).body(feedback);
            }
            return ResponseEntity.status(204).build();
        } catch (Exception e) {
            return ResponseEntity.status(404).build();
        }
    }

    /** Public — view all feedback (for customer display) */
    @GetMapping("/feedback")
    public ResponseEntity<List<Feedback>> getAllFeedBack() {
        try {
            List<Feedback> feedbacks = feedbackService.getAllFeedbacks();
            if (feedbacks.isEmpty()) {
                return ResponseEntity.status(204).build();
            }
            return ResponseEntity.status(200).body(feedbacks);
        } catch (Exception e) {
            return ResponseEntity.status(400).build();
        }
    }

    /** Authenticated — view feedback by user */
    @GetMapping("/feedback/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Feedback>> getFeedbacksByUserId(@PathVariable Long userId) {
        List<Feedback> feedbacks = feedbackService.getFeedbacksByUserId(userId);
        if (feedbacks.isEmpty()) {
            return ResponseEntity.status(204).build();
        }
        return ResponseEntity.status(200).body(feedbacks);
    }

    /** Admin only — delete feedback */
    @DeleteMapping("/feedback/{feedbackId}")
    @PreAuthorize("hasAuthority('ROLE_admin')")
    public ResponseEntity<Feedback> deleteFeedback(@PathVariable Long feedbackId) {
        Feedback feedback = feedbackService.deleteFeedback(feedbackId);
        if (feedback != null) {
            return ResponseEntity.status(200).body(feedback);
        }
        return ResponseEntity.status(404).build();
    }
}
