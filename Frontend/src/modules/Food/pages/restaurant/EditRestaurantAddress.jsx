import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import useRestaurantBackNavigation from "@food/hooks/useRestaurantBackNavigation"
import Lenis from "lenis"
import { ArrowLeft, ChevronDown } from "lucide-react"
import BottomPopup from "@delivery/components/BottomPopup"
import { restaurantAPI, zoneAPI } from "@food/api"
import { getGoogleMapsApiKey } from "@food/utils/googleMapsApiKey"
import { loadGoogleMaps as loadGoogleMapsSdk } from "@core/services/googleMapsLoader"
import { toast } from "react-hot-toast"
import { useRef } from "react"

const debugLog = (...args) => console.log(...args)
const debugWarn = (...args) => console.warn(...args)
const debugError = (...args) => console.error(...args)


const ADDRESS_STORAGE_KEY = "restaurant_address"

// Default coordinates for Indore (can be updated based on actual location)
const DEFAULT_LAT = 22.7196
const DEFAULT_LNG = 75.8577

export default function EditRestaurantAddress() {
  const navigate = useNavigate()
  const goBack = useRestaurantBackNavigation()
  const [address, setAddress] = useState("")
  const [restaurantName, setRestaurantName] = useState("")
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSelectOptionDialog, setShowSelectOptionDialog] = useState(false)
  const [selectedOption, setSelectedOption] = useState("minor_correction") // "update_address" or "minor_correction"
  const [lat, setLat] = useState(DEFAULT_LAT)
  const [lng, setLng] = useState(DEFAULT_LNG)
  const [currentZone, setCurrentZone] = useState(null)
  const [mapLoading, setMapLoading] = useState(true)

  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const polygonRef = useRef(null)
  const isMapInitializedRef = useRef(false)

  // Format address from location object
  const formatAddress = (loc) => {
    if (!loc) return ""
    const parts = []
    if (loc.addressLine1) parts.push(loc.addressLine1.trim())
    if (loc.addressLine2) parts.push(loc.addressLine2.trim())
    if (loc.area) parts.push(loc.area.trim())
    if (loc.city) {
      const city = loc.city.trim()
      if (!loc.area || !loc.area.includes(city)) {
        parts.push(city)
      }
    }
    if (loc.landmark) parts.push(loc.landmark.trim())
    return parts.join(", ") || ""
  }

  // Fetch restaurant and zone data
  useEffect(() => {
    const initPage = async () => {
      try {
        setLoading(true)
        setMapLoading(true)
        const response = await restaurantAPI.getCurrentRestaurant()
        const data = response?.data?.data?.restaurant || response?.data?.restaurant
        let zoneObj = null
        
        if (data) {
          setRestaurantName(data.restaurantName || data.name || "")
          setRestaurantData(data)
          if (data.location) {
            setLocation(data.location)
            const formatted = formatAddress(data.location)
            setAddress(formatted)
            if (data.location.latitude && data.location.longitude) {
              setLat(data.location.latitude)
              setLng(data.location.longitude)
            }
          }

          // Fetch zone data
          if (data.zoneId) {
            const zonesRes = await zoneAPI.getPublicZones()
            const allZones = zonesRes?.data?.data?.zones || zonesRes?.data?.zones || []
            zoneObj = allZones.find(z => String(z._id || z.id) === String(data.zoneId))
            if (zoneObj) {
              setCurrentZone(zoneObj)
            }
          }
        }

        // Load Map - Same logic as ZoneSetup
        const apiKey = await getGoogleMapsApiKey()
        if (!apiKey) {
          debugError("? Google Maps API key not found")
          setMapLoading(false)
          return
        }

        // Wait for mapRef to be available
        let refRetries = 0
        const maxRefRetries = 50 
        while (!mapRef.current && refRetries < maxRefRetries) {
          await new Promise(resolve => setTimeout(resolve, 100))
          refRetries++
        }

        if (!mapRef.current) {
          debugError("? mapRef.current is still null after waiting")
          setMapLoading(false)
          return
        }

        debugLog("?? Loading Google Maps SDK...")
        const maps = await loadGoogleMapsSdk(apiKey)
        if (!maps || !window.google?.maps) {
          throw new Error("Google Maps SDK did not finish loading")
        }

        debugLog("? Google Maps loaded, initializing map...")
        if (!isMapInitializedRef.current) {
          const startLat = data?.location?.latitude || lat || DEFAULT_LAT
          const startLng = data?.location?.longitude || lng || DEFAULT_LNG
          initializeMap(window.google, zoneObj, startLat, startLng)
        }
      } catch (error) {
        debugError("Error initializing page:", error)
        toast.error("Failed to load map data")
      } finally {
        setLoading(false)
        setMapLoading(false)
      }
    }

    initPage()
  }, [])

  const initializeMap = (google, zone, startLat, startLng) => {
    if (isMapInitializedRef.current || !mapRef.current) return
    isMapInitializedRef.current = true

    const centerLat = Number(startLat) || Number(lat) || DEFAULT_LAT
    const centerLng = Number(startLng) || Number(lng) || DEFAULT_LNG
    
    debugLog("?? Creating map instance at:", centerLat, centerLng)

    try {
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: 17,
        mapTypeControl: true,
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        gestureHandling: 'greedy',
      })
      mapInstanceRef.current = map

      // Draw Zone Polygon if available
      const activeZone = zone || currentZone
      if (activeZone?.coordinates) {
        const path = activeZone.coordinates.map(c => ({
          lat: Number(c.latitude || c.lat),
          lng: Number(c.longitude || c.lng)
        }))

        const polygon = new google.maps.Polygon({
          paths: path,
          strokeColor: "#3b82f6",
          strokeOpacity: 0.6,
          strokeWeight: 2,
          fillColor: "#3b82f6",
          fillOpacity: 0.15,
          map: map
        })
        polygonRef.current = polygon

        // Only allow clicks inside polygon to set marker
        polygon.addListener('click', (event) => {
          updateMarker(event.latLng.lat(), event.latLng.lng())
        })

        // Adjust map bounds to show polygon
        const bounds = new google.maps.LatLngBounds()
        path.forEach(p => bounds.extend(p))
        map.fitBounds(bounds)
      }

      // Initial Marker
      updateMarker(centerLat, centerLng)
      setMapLoading(false)
    } catch (e) {
      debugError("? Error creating map:", e)
      isMapInitializedRef.current = false
    }
  }

  const updateMarker = (newLat, newLng) => {
    const google = window.google
    if (!google || !mapInstanceRef.current) return

    // Validation: Check if point is inside currentZone polygon
    if (polygonRef.current && !google.maps.geometry.poly.containsLocation(new google.maps.LatLng(newLat, newLng), polygonRef.current)) {
      toast.error("Address must be inside your assigned zone")
      return
    }

    if (markerRef.current) {
      markerRef.current.setPosition({ lat: newLat, lng: newLng })
    } else {
      markerRef.current = new google.maps.Marker({
        position: { lat: newLat, lng: newLng },
        map: mapInstanceRef.current,
        draggable: true,
        animation: google.maps.Animation.DROP
      })

      markerRef.current.addListener('dragend', (event) => {
        const dragLat = event.latLng.lat()
        const dragLng = event.latLng.lng()
        
        // Validate drag position
        if (polygonRef.current && !google.maps.geometry.poly.containsLocation(new google.maps.LatLng(dragLat, dragLng), polygonRef.current)) {
          toast.error("Address must be inside your assigned zone")
          // Snap back to previous position
          markerRef.current.setPosition({ lat, lng })
        } else {
          setLat(dragLat)
          setLng(dragLng)
          getAddressFromCoords(dragLat, dragLng)
        }
      })
    }

    setLat(newLat)
    setLng(newLng)
    getAddressFromCoords(newLat, newLng)
  }

  const getAddressFromCoords = (lat, lng) => {
    if (!window.google?.maps?.Geocoder) return
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        setAddress(results[0].formatted_address)
      }
    })
  }

  const [restaurantData, setRestaurantData] = useState(null)

  // Lenis smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  // Handle opening Google Maps app
  const handleViewOnMap = () => {
    // Create Google Maps URL for the restaurant location
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    
    // Try to open in Google Maps app (mobile) or web
    window.open(googleMapsUrl, "_blank")
  }

  // Handle Update button click
  const handleUpdateClick = () => {
    setShowSelectOptionDialog(true)
  }

  // Handle Proceed to update
  const handleProceedUpdate = async () => {
    try {
      // For now, we'll update the location in the database
      // In a real scenario, you might want to handle FSSAI update flow separately
      if (selectedOption === "update_address") {
        // For major address update, you might want to navigate to a form
        // For now, we'll just show a message
        alert("For major address updates, FSSAI verification may be required. Please contact support.")
        setShowSelectOptionDialog(false)
        return
      } else {
        // Minor correction - update location coordinates
        // Fetch live address from coordinates using Google Maps API
        try {
          let formattedAddress = location?.formattedAddress || ""
          // Google Geocoding disabled - new backend in progress. Use existing or coords.
          if (lat && lng && !formattedAddress) {
            formattedAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          }

          // Update location with coordinates array and formattedAddress
          const updatedLocation = {
            ...location,
            latitude: lat,
            longitude: lng,
            coordinates: [lng, lat], // GeoJSON format: [longitude, latitude]
            formattedAddress: formattedAddress || location?.formattedAddress || ""
          }
          
          const response = await restaurantAPI.updateProfile({ location: updatedLocation })
          
          if (response?.data?.data?.restaurant) {
            // Update local state
            setLocation(updatedLocation)
            // Dispatch event to notify other components
            window.dispatchEvent(new Event("addressUpdated"))
            setShowSelectOptionDialog(false)
            goBack()
          } else {
            throw new Error("Invalid response from server")
          }
        } catch (updateError) {
          debugError("Error updating address:", updateError)
          alert(`Failed to update address: ${updateError.response?.data?.message || updateError.message || "Please try again."}`)
        }
      }
    } catch (error) {
      debugError("Error updating address:", error)
      alert(`Failed to update address: ${error.response?.data?.message || error.message || "Please try again."}`)
    }
  }

  // Get simplified address for navbar (last two parts: area, city)
  const getSimplifiedAddress = (fullAddress) => {
    const parts = fullAddress.split(",").map(p => p.trim())
    if (parts.length >= 2) {
      // Return last two parts (e.g., "By Pass Road (South), Indore")
      return parts.slice(-2).join(", ")
    }
    return fullAddress
  }
  
  const simplifiedAddress = getSimplifiedAddress(address)

  return (
    <div className="h-screen bg-white overflow-hidden flex flex-col">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50 flex items-center gap-3 shrink-0">
        <button
          onClick={goBack}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h1 className="text-base font-bold text-gray-900 truncate">{restaurantName}</h1>
          </div>
          <p className="text-xs text-gray-600 truncate">{simplifiedAddress}</p>
        </div>
      </div>

      {/* Map Section - Takes remaining space */}
      <div className="flex-1 relative overflow-hidden bg-gray-50 min-h-[400px]">
        {/* Google Maps Div */}
        <div 
          ref={mapRef}
          className="w-full h-full"
          style={{ minHeight: '400px', height: '100%' }}
        />
        
        {mapLoading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-[100]">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-sm text-gray-500 font-medium">Initializing Map...</p>
            </div>
          </div>
        )}
        
        {/* Address Details Section - Overlays map at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl z-20 px-4 pt-6">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-3">Outlet address</h2>
          
          {/* Informational Banner */}
          <div className="bg-blue-100 rounded-lg px-4 py-3 mb-4">
            <p className="text-sm text-gray-900">
              Customers and Appzeto delivery partners will use this to locate your outlet.
            </p>
          </div>

          {/* Current Address Display */}
          <div className="mb-4">
            <p className="text-base text-gray-900">{address}</p>
          </div>

          {/* Update Button */}
          <div className="pb-4">
            <button
              onClick={handleUpdateClick}
              className="w-full bg-black text-white font-semibold py-4 text-base rounded-lg"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      {/* Select Option Bottom Popup */}
      <BottomPopup
        isOpen={showSelectOptionDialog}
        onClose={() => setShowSelectOptionDialog(false)}
        title="Select an option"
        maxHeight="auto"
      >
        <div className=" space-y-0">
          {/* Option 1: Update outlet address */}
          <button
            onClick={() => setSelectedOption("update_address")}
            className="w-full flex items-start justify-between py-4 border-b border-dashed border-gray-300"
          >
            <div className="flex-1 text-left">
              <p className="text-base font-semibold text-gray-900 mb-1">
                Update outlet address (FSSAI required)
              </p>
              <p className="text-sm text-gray-500">{address}</p>
            </div>
            <div className="ml-4 shrink-0">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedOption === "update_address"
                    ? "border-black bg-black"
                    : "border-gray-300"
                }`}
              >
                {selectedOption === "update_address" && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
            </div>
          </button>

          {/* Option 2: Minor correction */}
          <button
            onClick={() => setSelectedOption("minor_correction")}
            className="w-full flex items-start justify-between py-4"
          >
            <div className="flex-1 text-left">
              <p className="text-base font-semibold text-gray-900 mb-1">
                Make a minor correction to the location pin
              </p>
              <p className="text-sm text-gray-500">
                If location pin on the map is slightly misplaced
              </p>
            </div>
            <div className="ml-4 shrink-0">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedOption === "minor_correction"
                    ? "border-black bg-black"
                    : "border-gray-300"
                }`}
              >
                {selectedOption === "minor_correction" && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
            </div>
          </button>

          {/* Proceed Button */}
          <button
            onClick={handleProceedUpdate}
            className="w-full bg-black text-white font-semibold py-4 rounded-lg mt-6"
          >
            Proceed to update
          </button>
        </div>
      </BottomPopup>
    </div>
  )
}

