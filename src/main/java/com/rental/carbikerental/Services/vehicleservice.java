package com.rental.carbikerental.Services;

import com.rental.carbikerental.entity.Vehicle;
import com.rental.carbikerental.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class vehicleservice {

    private final VehicleRepository vehicleRepository;

    public vehicleservice(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    public Vehicle saveVehicle(Vehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    public Vehicle getVehicleById(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
    }

    public void deleteVehicle(Long id) {
        vehicleRepository.deleteById(id);
    }
}