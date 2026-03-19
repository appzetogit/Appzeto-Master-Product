import { useCallback } from "react";

export function useRoutePolyline({
  selectedRestaurant,
  routePolyline,
  routePolylineRef,
  directionsRendererRef,
  debugLog,
  debugWarn,
}) {
  const updateRoutePolyline = useCallback(
    (coordinates = null) => {
      if (!selectedRestaurant) {
        if (routePolylineRef.current) {
          routePolylineRef.current.setMap(null);
        }
        return;
      }

      if (directionsRendererRef.current && directionsRendererRef.current.getMap()) {
        directionsRendererRef.current.setMap(null);
      }

      if (!window.google || !window.google.maps || !window.deliveryMapInstance) {
        debugWarn?.("Map not ready for polyline update");
        return;
      }

      const map = window.deliveryMapInstance;
      const coordsToUse = coordinates || routePolyline;

      if (coordsToUse && coordsToUse.length > 0) {
        const path = coordsToUse
          .map((coord) => {
            if (Array.isArray(coord) && coord.length >= 2) {
              return new window.google.maps.LatLng(coord[0], coord[1]);
            }
            return null;
          })
          .filter(Boolean);

        if (path.length > 0) {
          if (routePolylineRef.current) {
            routePolylineRef.current.setMap(null);
            routePolylineRef.current = null;
          }

          routePolylineRef.current = new window.google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: "#2563eb",
            strokeOpacity: 0.9,
            strokeWeight: 5,
            map,
            zIndex: 980,
          });

          if (path.length > 1) {
            const bounds = new window.google.maps.LatLngBounds();
            path.forEach((point) => bounds.extend(point));
            const currentZoomBeforeFit = map.getZoom();
            map.fitBounds(bounds, { padding: 50 });
            setTimeout(() => {
              const newZoom = map.getZoom();
              if (currentZoomBeforeFit > newZoom && currentZoomBeforeFit >= 18) {
                map.setZoom(currentZoomBeforeFit);
              }
            }, 100);
            debugLog?.("Map bounds adjusted to show route");
          }
        }
      } else if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
      }
    },
    [debugLog, debugWarn, directionsRendererRef, routePolyline, routePolylineRef, selectedRestaurant],
  );

  return { updateRoutePolyline };
}

