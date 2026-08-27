package com.examly.springapp.model;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;

@Data
@Entity
public class DriverRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long driverRequestId;
    private LocalDate requestDate;
    private String status;
    private LocalDate tripDate;
    private LocalTime timeSlot;
    private String pickupLocation;
    private String dropLocation;
    private String estimatedDuration;
    private Double paymentAmount;
    private String comments;
    private LocalTime actualDropTime;
    private LocalDate actualDropDate;
    private String actualDuration;
    private String paymentId;          // 👈 NEW: stores Razorpay payment ID
    private boolean isDeleted = false;

    @ManyToOne
    @JoinColumn(name = "userId", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "driverId", nullable = true)
    private Driver driver;

}