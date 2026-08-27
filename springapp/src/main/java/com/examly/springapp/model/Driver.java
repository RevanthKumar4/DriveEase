package com.examly.springapp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.Data;

@Data
@Entity
@Table(name = "driver")
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long driverId;

    @NotBlank(message = "Driver name is required")
    @Size(min = 2, max = 80, message = "Driver name must be between 2 and 80 characters")
    private String driverName;

    @NotBlank(message = "License number is required")
    private String licenseNumber;

    @Min(value = 0, message = "Experience years cannot be negative")
    private int experienceYears;

    @Pattern(
        regexp = "^[0-9]{10}$",
        message = "Contact number must be exactly 10 digits"
    )
    private String contactNumber;

    @NotBlank(message = "Availability status is required")
    private String availabilityStatus; // Active | Inactive | On Leave

    @Size(max = 200, message = "Address must not exceed 200 characters")
    private String address;

    @NotBlank(message = "Vehicle type is required")
    private String vehicleType; // sedan | suv | bike

    @NotNull(message = "Hourly rate is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Hourly rate must be greater than 0")
    private Double hourlyRate;

    private boolean isDeleted = false;

    /**
     * Base64-encoded driver photo.
     * Stored as LONGBLOB in MySQL.
     */
    @Lob
    @Column(columnDefinition = "LONGBLOB", nullable = true)
    private String image;
}
