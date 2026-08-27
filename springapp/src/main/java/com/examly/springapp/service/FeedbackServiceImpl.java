package com.examly.springapp.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.examly.springapp.model.Feedback;
import com.examly.springapp.repository.FeedbackRepo;

@Service
public class FeedbackServiceImpl implements FeedbackService {

    @Autowired
    private FeedbackRepo feedbackRepo;

    @Override
    public Feedback createFeedback(Feedback feedback) {
        return feedbackRepo.save(feedback);
    }

    @Override
    public Feedback getFeedbackById(Long feedbackId) {

        Optional<Feedback> feedback = feedbackRepo.findById(feedbackId);

        if (feedback.isPresent()) {
            return feedback.get();
        }

        return null;
    }

    @Override
    public List<Feedback> getAllFeedbacks() {
        return feedbackRepo.findAll();
    }

    @Override
    public Feedback deleteFeedback(Long feedbackId) {

        Optional<Feedback> feedback = feedbackRepo.findById(feedbackId);

        if (feedback.isPresent()) {

            Feedback deletedFeedback = feedback.get();

            feedbackRepo.deleteById(feedbackId);

            return deletedFeedback;
        }

        return null;
    }

    @Override
    public List<Feedback> getFeedbacksByUserId(Long userId) {
        return feedbackRepo.findByUserUserId(userId);
    }
}
