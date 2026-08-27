package com.examly.springapp.service;

import com.examly.springapp.model.DriverRequest;
import java.util.List;
import java.util.Optional;

public interface DriverRequestService {
    DriverRequest addDriverRequest(DriverRequest driverRequest);
    Optional<DriverRequest> getDriverRequestById(Long driverRequestId);
    List<DriverRequest> getAllDriverRequests();
    DriverRequest updateDriverRequest(Long driverRequestId, DriverRequest driverRequest);
    DriverRequest deleteDriverRequest(Long driverRequestId);
    List<DriverRequest> findDriverRequestsByUserId(Long userId);
    List<DriverRequest> findDriverRequestsByDriverId(Long driverId);
}