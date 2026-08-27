package com.examly.springapp.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.examly.springapp.model.Driver;

@Repository
public interface DriverRepo extends JpaRepository<Driver, Long>{
// day 1
}
   