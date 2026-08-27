package com.examly.springapp.service;

import com.examly.springapp.exceptions.DriverRequestDeletionException;
import com.examly.springapp.model.Driver;
import com.examly.springapp.model.DriverRequest;
import com.examly.springapp.repository.DriverRepo;
import com.examly.springapp.repository.DriverRequestRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DriverRequestServiceImpl implements DriverRequestService {

    @Autowired
    private DriverRequestRepo driverRequestRepo;

    @Autowired
    private DriverRepo driverRepo;

    @Override
    public DriverRequest addDriverRequest(DriverRequest driverRequest) {

        // ===== RULE 1: One active booking per customer =====
        if (driverRequest.getUser() != null && driverRequest.getUser().getUserId() != null) {

            Long userId = driverRequest.getUser().getUserId();

            List<DriverRequest> userRequests =
                driverRequestRepo.findByUser_UserId(userId);

            boolean hasActiveBooking = userRequests.stream().anyMatch(this::isActiveRequest);

            if (hasActiveBooking) {
                throw new RuntimeException(
                    "You already have an active booking. "
                    + "Please complete or cancel it before booking another driver.");
            }
        }

        // ===== RULE 2: Driver must be Active, then mark Inactive =====
        if (driverRequest.getDriver() != null && driverRequest.getDriver().getDriverId() != null) {
            Long driverId = driverRequest.getDriver().getDriverId();

            Driver driver = driverRepo.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

            if (!"Active".equalsIgnoreCase(driver.getAvailabilityStatus())) {
                throw new RuntimeException("Driver is currently booked by another user.");
            }

            driver.setAvailabilityStatus("Inactive");
            driverRepo.save(driver);
        }

        return driverRequestRepo.save(driverRequest);
    }

    @Override
    public Optional<DriverRequest> getDriverRequestById(Long driverRequestId) {
        return driverRequestRepo.findById(driverRequestId);
    }

    @Override
    public List<DriverRequest> getAllDriverRequests() {
        return driverRequestRepo.findAll();
    }

    @Override
    public DriverRequest updateDriverRequest(Long driverRequestId, DriverRequest driverRequest) {
        Optional<DriverRequest> existing = driverRequestRepo.findById(driverRequestId);
        if (existing.isEmpty()) {
            return null;
        }

        DriverRequest dr = existing.get();

        if (driverRequest.getStatus() != null)            dr.setStatus(driverRequest.getStatus());
        if (driverRequest.getTripDate() != null)          dr.setTripDate(driverRequest.getTripDate());
        if (driverRequest.getTimeSlot() != null)          dr.setTimeSlot(driverRequest.getTimeSlot());
        if (driverRequest.getPickupLocation() != null)    dr.setPickupLocation(driverRequest.getPickupLocation());
        if (driverRequest.getDropLocation() != null)      dr.setDropLocation(driverRequest.getDropLocation());
        if (driverRequest.getEstimatedDuration() != null) dr.setEstimatedDuration(driverRequest.getEstimatedDuration());
        if (driverRequest.getPaymentAmount() != null)     dr.setPaymentAmount(driverRequest.getPaymentAmount());
        if (driverRequest.getComments() != null)          dr.setComments(driverRequest.getComments());
        if (driverRequest.getActualDropTime() != null)    dr.setActualDropTime(driverRequest.getActualDropTime());
        if (driverRequest.getActualDropDate() != null)    dr.setActualDropDate(driverRequest.getActualDropDate());
        if (driverRequest.getActualDuration() != null)    dr.setActualDuration(driverRequest.getActualDuration());
        if (driverRequest.getPaymentId() != null)         dr.setPaymentId(driverRequest.getPaymentId());

        // ===== Free the driver when trip is closed/completed/cancelled =====
        String newStatus = driverRequest.getStatus();
        if ("Closed".equalsIgnoreCase(newStatus) ||
            "Trip End".equalsIgnoreCase(newStatus) ||
            "Cancelled".equalsIgnoreCase(newStatus) ||
            "Canceled".equalsIgnoreCase(newStatus)) {

            if (dr.getDriver() != null && dr.getDriver().getDriverId() != null) {
                Driver d = driverRepo.findById(dr.getDriver().getDriverId()).orElse(null);
                if (d != null) {
                    d.setAvailabilityStatus("Active");
                    driverRepo.save(d);
                }
            }
        }

        if (driverRequest.getDriver() != null)  dr.setDriver(driverRequest.getDriver());
        if (driverRequest.getUser() != null)    dr.setUser(driverRequest.getUser());

        return driverRequestRepo.save(dr);
    }

    @Override
    public DriverRequest deleteDriverRequest(Long driverRequestId) {
        Optional<DriverRequest> existing = driverRequestRepo.findById(driverRequestId);
        if (existing.isEmpty()) {
            return null;
        }
        try {
            DriverRequest dr = existing.get();

            // Free the driver on cancel/delete
            if (dr.getDriver() != null && dr.getDriver().getDriverId() != null) {
                Driver d = driverRepo.findById(dr.getDriver().getDriverId()).orElse(null);
                if (d != null) {
                    d.setAvailabilityStatus("Active");
                    driverRepo.save(d);
                }
            }

            driverRequestRepo.deleteById(driverRequestId);
            return dr;
        } catch (Exception e) {
            throw new DriverRequestDeletionException(
                "Unable to delete driver request with id: " + driverRequestId);
        }
    }

    @Override
    public List<DriverRequest> findDriverRequestsByUserId(Long userId) {
        return driverRequestRepo.findByUser_UserId(userId);
    }

    @Override
    public List<DriverRequest> findDriverRequestsByDriverId(Long driverId) {
        return driverRequestRepo.findByDriver_DriverId(driverId);
    }

    /**
     * A request is considered active until it is completed,
     * closed, or cancelled.
     */
    private boolean isActiveRequest(DriverRequest request) {
        if (request == null) {
            return false;
        }

        String status = request.getStatus();

        // No status yet → treat as active (pending)
        if (status == null || status.trim().isEmpty()) {
            return true;
        }

        return !"Trip End".equalsIgnoreCase(status)
            && !"Closed".equalsIgnoreCase(status)
            && !"Cancelled".equalsIgnoreCase(status)
            && !"Canceled".equalsIgnoreCase(status);
    }
}