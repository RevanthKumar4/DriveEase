package com.examly.springapp.controller;

import java.util.List;
import java.util.Optional;

import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.examly.springapp.model.Driver;
import com.examly.springapp.service.DriverService;

@RestController
@RequestMapping("/api")
public class DriverController {

    private static final Logger log = LoggerFactory.getLogger(DriverController.class);

    private final DriverService driverService;

    public DriverController(DriverService driverService) {
        this.driverService = driverService;
    }

    /** Admin only — add a new driver */
    @PostMapping("/driver")
    @PreAuthorize("hasAuthority('ROLE_admin')")
    public ResponseEntity<Driver> addDriver(@Valid @RequestBody Driver driver) {
        try {
            Driver createdDriver = driverService.addDriver(driver);
            log.info("New driver added");
            return new ResponseEntity<>(createdDriver, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }
    }

    /** Public — view driver by ID */
    @GetMapping("/driver/{driverId}")
    public ResponseEntity<Driver> getDriverById(@PathVariable Long driverId) {
        Optional<Driver> driver = driverService.getDriverById(driverId);
        return driver.map(d -> new ResponseEntity<>(d, HttpStatus.OK))
                     .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /** Public — view all drivers */
    @GetMapping("/driver")
    public ResponseEntity<List<Driver>> getAllDrivers() {
        try {
            List<Driver> drivers = driverService.getAllDrivers();
            if (drivers.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            }
            return new ResponseEntity<>(drivers, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    /** Admin only — update driver */
    @PutMapping("/driver/{driverId}")
    @PreAuthorize("hasAuthority('ROLE_admin')")
    public ResponseEntity<Driver> updateDriver(
            @PathVariable Long driverId,
            @Valid @RequestBody Driver driver) {
        Driver updatedDriver = driverService.updateDriver(driverId, driver);
        if (updatedDriver != null) {
            return new ResponseEntity<>(updatedDriver, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    /** Admin only — soft-delete driver */
    @DeleteMapping("/driver/{driverId}")
    @PreAuthorize("hasAuthority('ROLE_admin')")
    public ResponseEntity<Driver> deleteDriver(@PathVariable Long driverId) {
        Driver deletedDriver = driverService.deleteDriver(driverId);
        if (deletedDriver != null) {
            return new ResponseEntity<>(deletedDriver, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
}