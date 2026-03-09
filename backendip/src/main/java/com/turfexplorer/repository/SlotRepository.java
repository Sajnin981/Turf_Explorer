package com.turfexplorer.repository;

import com.turfexplorer.entity.Slot;
import com.turfexplorer.enums.SlotStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SlotRepository extends JpaRepository<Slot, Long> {
    List<Slot> findByTurfId(Long turfId);
    List<Slot> findByTurfIdAndStatus(Long turfId, SlotStatus status);
}
