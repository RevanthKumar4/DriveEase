package com.examly.springapp.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.examly.springapp.model.Driver;
import com.examly.springapp.repository.DriverRepo;

@Service
public class DriverServiceImpl implements DriverService {

    @Autowired
    private DriverRepo driverRepo;

    @Override
    public Driver addDriver(Driver driver) {
        return driverRepo.save(driver);
    }

    @Override
    public Optional<Driver> getDriverById(Long driverId) {
        return driverRepo.findById(driverId);
    }

    @Override
    public List<Driver> getAllDrivers() {
        return driverRepo.findAll()
                .stream()
                .filter(driver -> !driver.isDeleted())
                .toList();
    }

    @Override
    public Driver updateDriver(
            Long driverId,
            Driver driver) {

        Optional<Driver> existingDriver =
                driverRepo.findById(driverId);

        if (existingDriver.isPresent()) {

            Driver updatedDriver =
                    existingDriver.get();

            updatedDriver.setDriverName(
                    driver.getDriverName()
            );
            updatedDriver.setLicenseNumber(
                    driver.getLicenseNumber()
            );
            updatedDriver.setExperienceYears(
                    driver.getExperienceYears()
            );
            updatedDriver.setContactNumber(
                    driver.getContactNumber()
            );
            updatedDriver.setAvailabilityStatus(
                    driver.getAvailabilityStatus()
            );
            updatedDriver.setAddress(
                    driver.getAddress()
            );
            updatedDriver.setVehicleType(
                    driver.getVehicleType()
            );
            updatedDriver.setHourlyRate(
                    driver.getHourlyRate()
            );
            updatedDriver.setImage(
                    driver.getImage()
            );

            return driverRepo.save(updatedDriver);
        }

        return null;
    }

    @Override
    public Driver deleteDriver(Long driverId) {

        Optional<Driver> existingDriver =
                driverRepo.findById(driverId);

        if (existingDriver.isEmpty()) {
            return null;
        }

        Driver driver = existingDriver.get();
        driver.setDeleted(true);

        return driverRepo.save(driver);
    }
}