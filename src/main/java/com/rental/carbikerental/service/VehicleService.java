package com.rental.carbikerental.service;

import com.rental.carbikerental.entity.Vehicle;
import com.rental.carbikerental.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VehicleService  {

    private final VehicleRepository vehicleRepository;

    public VehicleService(VehicleRepository vehicleRepository) {
    this.vehicleRepository = vehicleRepository;
}

    public Vehicle saveVehicle(Vehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    public Vehicle getVehicleById(String id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
    }

    public void deleteVehicle(String id) {
        vehicleRepository.deleteById(id);
    }

    public void deleteAllVehicles() {
        vehicleRepository.deleteAll();
    }
}