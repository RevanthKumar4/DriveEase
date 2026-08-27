package com.examly.springapp.controller;

import com.examly.springapp.model.DriverRequest;
import com.examly.springapp.service.DriverRequestService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/driverRequest")
public class DriverRequestController {

    private static final Logger log = LoggerFactory.getLogger(DriverRequestController.class);

    private final DriverRequestService driverRequestService;

    public DriverRequestController(DriverRequestService driverRequestService) {
        this.driverRequestService = driverRequestService;
    }

    /** Customers create a booking request */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> addDriverRequest(@RequestBody DriverRequest driverRequest) {
        try {
            DriverRequest saved = driverRequestService.addDriverRequest(driverRequest);
            if (saved == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            log.info("New driver request created");
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(java.util.Map.of("message", e.getMessage()));
        }
    }

    /** Admin or the owning customer can get a specific request */
    @GetMapping("/{driverRequestId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getDriverRequestById(@PathVariable Long driverRequestId) {
        Optional<DriverRequest> req = driverRequestService.getDriverRequestById(driverRequestId);
        if (req.isPresent()) {
            return ResponseEntity.ok(req.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    /** Customers view their own requests — note: backend service filters by userId */
    @GetMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getDriverRequestsByUserId(@PathVariable Long userId,
                                                        Authentication authentication) {
        try {
            List<DriverRequest> list = driverRequestService.findDriverRequestsByUserId(userId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /** Admin views all requests */
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_admin')")
    public ResponseEntity<?> getAllDriverRequests() {
        try {
            List<DriverRequest> list = driverRequestService.getAllDriverRequests();
            if (list == null || list.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
            }
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /** Admin or customer can update a request (status updates, etc.) */
    @PutMapping("/{driverRequestId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateDriverRequest(
            @PathVariable Long driverRequestId,
            @RequestBody DriverRequest driverRequest) {
        DriverRequest updated = driverRequestService.updateDriverRequest(driverRequestId, driverRequest);
        if (updated == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(updated);
    }

    /** Admin views requests by driver */
    @GetMapping("/driver/{driverId}")
    @PreAuthorize("hasAuthority('ROLE_admin')")
    public ResponseEntity<?> getDriverRequestsByDriverId(@PathVariable Long driverId) {
        try {
            List<DriverRequest> list = driverRequestService.findDriverRequestsByDriverId(driverId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /** Customers or admin can cancel a request */
    @DeleteMapping("/{driverRequestId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteDriverRequest(@PathVariable Long driverRequestId) {
        DriverRequest deleted = driverRequestService.deleteDriverRequest(driverRequestId);
        if (deleted == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(deleted);
    }
}