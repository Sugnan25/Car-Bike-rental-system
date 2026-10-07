package com.carrental.repositories;

import com.carrental.models.Vehicle;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleRepository extends MongoRepository<Vehicle, String> {
    List<Vehicle> findByAvailable(boolean available);
    List<Vehicle> findByTypeAndAvailable(String type, boolean available);

    @Query("{ 'available': true, $or: [ { 'model': { $regex: ?0, $options: 'i' } }, { 'company': { $regex: ?0, $options: 'i' } }, { 'description': { $regex: ?0, $options: 'i' } } ] }")
    List<Vehicle> searchVehicles(String keyword);
}
