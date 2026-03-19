export function toFiniteCoordinate(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getCustomerDestination(restaurantInfo) {
  if (!restaurantInfo) return null;
  const lat = toFiniteCoordinate(restaurantInfo.customerLat);
  const lng = toFiniteCoordinate(restaurantInfo.customerLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function isDirectionsResultNearDestination(directionsResult, destination, thresholdMeters = 120) {
  if (!directionsResult || !destination) return false;
  const legs = directionsResult?.routes?.[0]?.legs;
  const lastLeg = Array.isArray(legs) && legs.length > 0 ? legs[legs.length - 1] : null;
  const endLocation = lastLeg?.end_location;
  if (!endLocation) return false;

  const endLat = typeof endLocation.lat === "function" ? endLocation.lat() : Number(endLocation.lat);
  const endLng = typeof endLocation.lng === "function" ? endLocation.lng() : Number(endLocation.lng);
  if (!Number.isFinite(endLat) || !Number.isFinite(endLng)) return false;

  return haversineDistance(endLat, endLng, destination.lat, destination.lng) <= thresholdMeters;
}

export function shouldAcceptLocation(position, lastValidLocation, lastLocationTime, log = null) {
  const accuracy = position.coords.accuracy || 0;
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  const isFirstLocation = !lastValidLocation || !lastLocationTime;
  if (isFirstLocation) {
    if (accuracy > 1000) {
      log?.("First location rejected: accuracy extremely poor", { accuracy: `${accuracy.toFixed(2)}m` });
      return false;
    }
    log?.("Accepting first location", {
      accuracy: `${accuracy.toFixed(2)}m`,
      lat: latitude,
      lng: longitude,
    });
    return true;
  }

  if (accuracy > 200) {
    log?.("Location rejected: accuracy too poor", { accuracy: `${accuracy.toFixed(2)}m` });
    return false;
  }

  if (lastValidLocation && lastLocationTime) {
    const [prevLat, prevLng] = lastValidLocation;
    const distance = haversineDistance(prevLat, prevLng, latitude, longitude);
    const timeDiff = (Date.now() - lastLocationTime) / 1000;

    if (distance > 50 && timeDiff < 2) {
      log?.("Location rejected: distance jump too large", {
        distance: `${distance.toFixed(2)}m`,
        timeDiff: `${timeDiff.toFixed(2)}s`,
      });
      return false;
    }

    if (timeDiff > 0) {
      const speedKmh = (distance / timeDiff) * 3.6;
      if (speedKmh > 60) {
        log?.("Location rejected: speed too high", { speed: `${speedKmh.toFixed(2)} km/h` });
        return false;
      }
    }
  }

  return true;
}

