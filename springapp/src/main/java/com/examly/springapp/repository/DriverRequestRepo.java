package com.examly.springapp.repository;

import com.examly.springapp.model.DriverRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DriverRequestRepo extends JpaRepository<DriverRequest, Long> {

    List<DriverRequest> findByUser_UserId(Long userId);

    List<DriverRequest> findByDriver_DriverId(Long driverId);
}