package com.turfexplorer.repository;

import com.turfexplorer.entity.Turf;
import com.turfexplorer.enums.TurfStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TurfRepository extends JpaRepository<Turf, Long> {
    List<Turf> findByStatus(TurfStatus status);
    List<Turf> findByStatusAndNameContainingIgnoreCase(TurfStatus status, String name);
    List<Turf> findByStatusAndAvailableTrue(TurfStatus status);
    List<Turf> findByStatusAndAvailableTrueAndNameContainingIgnoreCase(TurfStatus status, String name);
    List<Turf> findTop10ByStatusAndNameContainingIgnoreCaseOrderByNameAsc(TurfStatus status, String name);
    List<Turf> findByOwnerId(Long ownerId);
    List<Turf> findByOwnerIdAndStatus(Long ownerId, TurfStatus status);
    long countByStatus(TurfStatus status);
    List<Turf> findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNull(TurfStatus status);
}
