package com.examly.springapp.model;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.Data;

@Data
@Entity
@Table(name = "feedback")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long feedbackId;

    @NotBlank(message = "Category is required")
    private String category;

    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private int rating;

    @NotBlank(message = "Feedback text is required")
    @Size(min = 5, max = 1000, message = "Feedback must be between 5 and 1000 characters")
    private String feedbackText;

    private LocalDate date;

    private boolean isDeleted = false;

    @NotNull(message = "User is required")
    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"feedbacks", "password"})
    private User user;

    @ManyToOne
    @JoinColumn(name = "driver_id")
    @JsonIgnoreProperties({"feedbacks"})
    private Driver driver;

    public Feedback() {}

    public Feedback(Long feedbackId, String category, int rating, String feedbackText,
                    LocalDate date, User user, Driver driver) {
        this.feedbackId = feedbackId;
        this.category = category;
        this.rating = rating;
        this.feedbackText = feedbackText;
        this.date = date;
        this.user = user;
        this.driver = driver;
    }
}