package com.carrental.services;

import com.carrental.models.Vehicle;
import com.carrental.repositories.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    public List<Vehicle> getAvailableVehicles() {
        return vehicleRepository.findByAvailable(true);
    }

    public Optional<Vehicle> getVehicleById(String id) {
        return vehicleRepository.findById(id);
    }

    public List<Vehicle> searchAndFilter(String query, String type, String fuelType, Double maxPrice) {
        List<Vehicle> list = vehicleRepository.findByAvailable(true);

        return list.stream().filter(v -> {
            boolean matchesQuery = true;
            if (query != null && !query.trim().isEmpty()) {
                String q = query.trim().toLowerCase();
                matchesQuery = (v.getModel() != null && v.getModel().toLowerCase().contains(q)) ||
                               (v.getCompany() != null && v.getCompany().toLowerCase().contains(q)) ||
                               (v.getDescription() != null && v.getDescription().toLowerCase().contains(q)) ||
                               (v.getVehicleNumber() != null && v.getVehicleNumber().toLowerCase().contains(q));
            }

            boolean matchesType = true;
            if (type != null && !type.trim().isEmpty() && !type.equalsIgnoreCase("all")) {
                matchesType = v.getType() != null && v.getType().equalsIgnoreCase(type.trim());
            }

            boolean matchesFuel = true;
            if (fuelType != null && !fuelType.trim().isEmpty() && !fuelType.equalsIgnoreCase("all")) {
                matchesFuel = v.getFuelType() != null && v.getFuelType().equalsIgnoreCase(fuelType.trim());
            }

            boolean matchesPrice = true;
            if (maxPrice != null && maxPrice > 0) {
                matchesPrice = v.getPricePerKm() != null && v.getPricePerKm() <= maxPrice;
            }

            return matchesQuery && matchesType && matchesFuel && matchesPrice;
        }).collect(Collectors.toList());
    }

    public Vehicle saveVehicle(Vehicle vehicle) {
        if (vehicle.getCreatedAt() == null) {
            vehicle.setCreatedAt(new Date());
        }
        return vehicleRepository.save(vehicle);
    }

    public void deleteVehicle(String id) {
        vehicleRepository.deleteById(id);
    }

    public void clearAllVehicles() {
        vehicleRepository.deleteAll();
    }
}
