package com.turfexplorer.service;

import org.springframework.stereotype.Service;

/**
 * Provides reusable Haversine distance calculations for the location-based discovery APIs.
 */
@Service
public class DistanceService {

    private static final double EARTH_RADIUS_KM = 6371.0;

    public Double calculateDistance(Double originLat, Double originLng, Double targetLat, Double targetLng) {
        if (originLat == null || originLng == null || targetLat == null || targetLng == null) {
            return null;
        }

        double latDistance = Math.toRadians(targetLat - originLat);
        double lngDistance = Math.toRadians(targetLng - originLng);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(originLat)) * Math.cos(Math.toRadians(targetLat))
                * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = EARTH_RADIUS_KM * c;

        // Round to one decimal place to keep responses compact
        return Math.round(distance * 10.0) / 10.0;
    }
}
