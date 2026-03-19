import { useState, useEffect, useMemo } from "react"
import { Calendar, Clock, Users, Search, MessageSquare, CheckCircle2, Clock4, UploadCloud, ImagePlus, ChevronDown, ChevronUp, Sparkles } from "lucide-react"
import { diningAPI, restaurantAPI } from "@food/api"
import Loader from "@food/components/Loader"
import { Badge } from "@food/components/ui/badge"
const debugError = (...args) => {}

const getRestaurantFromResponse = (response) =>
    response?.data?.data?.restaurant ||
    response?.data?.restaurant ||
    response?.data?.data ||
    null

const normalizeImageEntry = (entry) => {
    if (!entry) return null
    if (typeof entry === "string") {
        const url = entry.trim()
        return url ? { url, publicId: null } : null
    }
    const url = String(entry?.url || "").trim()
    if (!url) return null
    return {
        url,
        publicId: entry?.publicId || null,
    }
}

const getProfilePhotoUrl = (restaurant) => {
    const candidate = restaurant?.profileImage
    if (!candidate) return ""
    if (typeof candidate === "string") return candidate.trim()
    return String(candidate?.url || "").trim()
}

const getMenuImages = (restaurant) => {
    const base = Array.isArray(restaurant?.menuImages)
        ? restaurant.menuImages
        : Array.isArray(restaurant?.coverImages)
            ? restaurant.coverImages
            : []

    return base
        .map(normalizeImageEntry)
        .filter(Boolean)
}


export default function DiningReservations() {
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [restaurant, setRestaurant] = useState(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [restaurantPhoto, setRestaurantPhoto] = useState("")
    const [menuPhotos, setMenuPhotos] = useState([])
    const [uploadingRestaurantPhoto, setUploadingRestaurantPhoto] = useState(false)
    const [uploadingMenuPhotos, setUploadingMenuPhotos] = useState(false)
    const [uploadMessage, setUploadMessage] = useState("")
    const [uploadError, setUploadError] = useState("")
    const [activeSection, setActiveSection] = useState("reservations")
    const [activeView, setActiveView] = useState("priority")
    const [showMediaPanel, setShowMediaPanel] = useState(false)

    const syncRestaurantMediaState = (restaurantData) => {
        setRestaurant(restaurantData || null)
        setRestaurantPhoto(getProfilePhotoUrl(restaurantData))
        setMenuPhotos(getMenuImages(restaurantData))
    }

    useEffect(() => {
        const fetchAll = async () => {
            try {
                // First get the current restaurant
                const resResponse = await restaurantAPI.getCurrentRestaurant()
                if (resResponse.data.success) {
                    const resData = getRestaurantFromResponse(resResponse)

                    const restaurantId = resData?._id || resData?.id

                    if (restaurantId) {
                        syncRestaurantMediaState(resData)
                        // Then get its bookings
                        const bookingsResponse = await diningAPI.getRestaurantBookings(restaurantId)
                        if (bookingsResponse.data.success) {
                            setBookings(Array.isArray(bookingsResponse.data.data) ? bookingsResponse.data.data : [])
                        }
                    } else {
                        debugError("Restaurant ID not found in response:", resData)
                    }
                }
            } catch (error) {
                debugError("Error fetching reservations:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchAll()
    }, [])

    const handleRestaurantPhotoUpload = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        setUploadError("")
        setUploadMessage("")
        setUploadingRestaurantPhoto(true)

        try {
            await restaurantAPI.uploadProfileImage(file)
            const refreshedResponse = await restaurantAPI.getCurrentRestaurant()
            const refreshedRestaurant = getRestaurantFromResponse(refreshedResponse)
            syncRestaurantMediaState(refreshedRestaurant)
            setUploadMessage("Restaurant photo updated successfully.")
        } catch (error) {
            debugError("Error uploading restaurant photo:", error)
            setUploadError(error?.response?.data?.message || "Failed to upload restaurant photo.")
        } finally {
            setUploadingRestaurantPhoto(false)
            event.target.value = ""
        }
    }

    const handleMenuPhotosUpload = async (event) => {
        const files = Array.from(event.target.files || [])
        if (files.length === 0) return

        setUploadError("")
        setUploadMessage("")
        setUploadingMenuPhotos(true)

        try {
            const uploadedImages = []
            const failedUploads = []

            for (const file of files) {
                try {
                    const uploadResponse = await restaurantAPI.uploadMenuImage(file)
                    const imageCandidate =
                        normalizeImageEntry(uploadResponse?.data?.data?.menuImage) ||
                        normalizeImageEntry(uploadResponse?.data?.data?.menuImages?.[0])

                    if (imageCandidate) {
                        uploadedImages.push(imageCandidate)
                    } else {
                        failedUploads.push(file.name)
                    }
                } catch (uploadError) {
                    debugError("Menu image upload failed:", uploadError)
                    failedUploads.push(file.name)
                }
            }

            if (uploadedImages.length === 0) {
                setUploadError("No menu photos were uploaded. Please try again.")
                return
            }

            const existingImages = getMenuImages(restaurant)
            const mergedImages = [...existingImages]

            uploadedImages.forEach((img) => {
                if (!mergedImages.find((existing) => existing.url === img.url)) {
                    mergedImages.push(img)
                }
            })

            const profileResponse = await restaurantAPI.updateProfile({
                menuImages: mergedImages.map((img) => ({
                    url: img.url,
                    ...(img.publicId ? { publicId: img.publicId } : {}),
                })),
            })

            const updatedRestaurant = getRestaurantFromResponse(profileResponse)
            if (updatedRestaurant) {
                syncRestaurantMediaState(updatedRestaurant)
            } else {
                const refreshedResponse = await restaurantAPI.getCurrentRestaurant()
                syncRestaurantMediaState(getRestaurantFromResponse(refreshedResponse))
            }

            if (failedUploads.length > 0) {
                setUploadMessage(`Uploaded ${uploadedImages.length} photo(s), but ${failedUploads.length} failed.`)
            } else {
                setUploadMessage(`Uploaded ${uploadedImages.length} menu photo(s) successfully.`)
            }
        } catch (error) {
            debugError("Error saving menu photos:", error)
            setUploadError(error?.response?.data?.message || "Failed to upload menu photos.")
        } finally {
            setUploadingMenuPhotos(false)
            event.target.value = ""
        }
    }

    const handleStatusUpdate = async (bookingId, newStatus) => {
        try {
            const response = await diningAPI.updateBookingStatusRestaurant(bookingId, newStatus)
            if (response.data.success) {
                // Update local state
                setBookings(prev => prev.map(b =>
                    b._id === bookingId ? { ...b, status: newStatus } : b
                ))
            }
        } catch (error) {
            debugError("Error updating status:", error)
        }
    }

    const getStatusPriority = (status) => {
        const key = String(status || "").toLowerCase()
        if (key === "confirmed") return 0
        if (key === "checked-in") return 1
        if (key === "completed") return 2
        return 3
    }

    const getBookingTimestamp = (booking) => {
        const createdAtTs = new Date(booking?.createdAt || "").getTime()
        if (!Number.isNaN(createdAtTs)) return createdAtTs
        const dateTs = new Date(booking?.date || "").getTime()
        if (!Number.isNaN(dateTs)) return dateTs
        return 0
    }

    const isToday = (value) => {
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return false
        return date.toDateString() === new Date().toDateString()
    }

    const isNewRequest = (booking) => {
        if (String(booking?.status || "").toLowerCase() !== "confirmed") return false
        const createdAt = new Date(booking?.createdAt || booking?.date || "").getTime()
        if (Number.isNaN(createdAt)) return true
        return Date.now() - createdAt <= 2 * 60 * 60 * 1000
    }

    const sortedBookings = useMemo(() => {
        return [...bookings].sort((a, b) => {
            const priorityDiff = getStatusPriority(a?.status) - getStatusPriority(b?.status)
            if (priorityDiff !== 0) return priorityDiff
            return getBookingTimestamp(b) - getBookingTimestamp(a)
        })
    }, [bookings])

    const filteredBookings = useMemo(() => {
        const term = searchTerm.trim().toLowerCase()
        return sortedBookings
            .filter((booking) => {
                if (!term) return true
                return (
                    String(booking?.user?.name || "").toLowerCase().includes(term) ||
                    String(booking?.bookingId || "").toLowerCase().includes(term) ||
                    String(booking?.user?.phone || "").toLowerCase().includes(term)
                )
            })
            .filter((booking) => {
                if (activeView === "today") return isToday(booking?.date)
                if (activeView === "new") return isNewRequest(booking)
                return true
            })
    }, [sortedBookings, searchTerm, activeView])

    const newRequestsCount = useMemo(
        () => bookings.filter((booking) => isNewRequest(booking)).length,
        [bookings]
    )

    if (loading) return <Loader />

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white p-6 border-b sticky top-0 z-30">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Table Reservations</h1>
                        <p className="text-slate-500 text-sm mt-1">Manage new requests first, then handle the rest smoothly.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                id="reservation-search"
                                name="reservation-search"
                                placeholder="Search by name or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                            />
                        </div>
                        <div className="hidden md:flex items-center gap-2 rounded-xl bg-slate-100 p-1">
                            <button
                                onClick={() => setActiveSection("reservations")}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeSection === "reservations" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                            >
                                Reservations
                            </button>
                            <button
                                onClick={() => setActiveSection("media")}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeSection === "media" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                            >
                                Photos & Menu
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Total Bookings</p>
                                <p className="text-2xl font-bold text-slate-900">{bookings.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="bg-green-50 p-3 rounded-xl text-green-600">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Confirmed</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {bookings.filter(b => b.status === 'confirmed' || b.status === 'checked-in').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="bg-orange-50 p-3 rounded-xl text-orange-600">
                                <Clock4 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Today's Bookings</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {bookings.filter(b => new Date(b.date).toDateString() === new Date().toDateString()).length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6 md:hidden">
                    <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 p-1">
                        <button
                            onClick={() => setActiveSection("reservations")}
                            className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${activeSection === "reservations" ? "bg-slate-900 text-white" : "text-slate-600"}`}
                        >
                            Reservations
                        </button>
                        <button
                            onClick={() => setActiveSection("media")}
                            className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${activeSection === "media" ? "bg-slate-900 text-white" : "text-slate-600"}`}
                        >
                            Photos & Menu
                        </button>
                    </div>
                </div>

                {activeSection === "media" && (
                <div className="mb-8">
                    <button
                        onClick={() => setShowMediaPanel((prev) => !prev)}
                        className="w-full bg-white rounded-2xl border border-slate-200 px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                        <div>
                            <h2 className="text-left text-base font-bold text-slate-900">Photos & Menu Manager</h2>
                            <p className="text-left text-sm text-slate-500">Upload restaurant and menu images only when needed.</p>
                        </div>
                        {showMediaPanel ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                    </button>
                </div>
                )}

                {activeSection === "media" && showMediaPanel && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Restaurant Photo</h2>
                                <p className="text-sm text-slate-500 mt-1">Upload and replace your main restaurant photo.</p>
                            </div>
                            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
                                <UploadCloud className="w-4 h-4" />
                                {uploadingRestaurantPhoto ? "Uploading..." : "Upload"}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleRestaurantPhotoUpload}
                                    disabled={uploadingRestaurantPhoto}
                                />
                            </label>
                        </div>

                        <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-56">
                            {restaurantPhoto ? (
                                <img
                                    src={restaurantPhoto}
                                    alt={restaurant?.restaurantName || restaurant?.name || "Restaurant"}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                    <ImagePlus className="w-8 h-8 mb-2" />
                                    <p className="text-sm font-medium">No restaurant photo added yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Menu Photos</h2>
                                <p className="text-sm text-slate-500 mt-1">Add menu photos and view previously uploaded photos.</p>
                            </div>
                            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors">
                                <UploadCloud className="w-4 h-4" />
                                {uploadingMenuPhotos ? "Uploading..." : "Add Photos"}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={handleMenuPhotosUpload}
                                    disabled={uploadingMenuPhotos}
                                />
                            </label>
                        </div>

                        {menuPhotos.length > 0 ? (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {menuPhotos.map((photo, index) => (
                                    <div key={`${photo.url}-${index}`} className="h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                                        <img src={photo.url} alt={`Menu photo ${index + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-4 h-28 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                                <ImagePlus className="w-7 h-7 mb-2" />
                                <p className="text-sm font-medium">No menu photos added yet</p>
                            </div>
                        )}
                    </div>
                </div>
                )}

                {(uploadMessage || uploadError) && (
                    <div className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium border ${uploadError
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-green-50 text-green-700 border-green-200"
                        }`}>
                        {uploadError || uploadMessage}
                    </div>
                )}

                {/* Bookings List */}
                {activeSection === "reservations" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-bold text-slate-800">Reservation Queue</h2>
                        <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 p-1">
                            <button
                                onClick={() => setActiveView("priority")}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeView === "priority" ? "bg-slate-900 text-white" : "text-slate-500"}`}
                            >
                                Priority
                            </button>
                            <button
                                onClick={() => setActiveView("new")}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeView === "new" ? "bg-slate-900 text-white" : "text-slate-500"}`}
                            >
                                New ({newRequestsCount})
                            </button>
                            <button
                                onClick={() => setActiveView("today")}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeView === "today" ? "bg-slate-900 text-white" : "text-slate-500"}`}
                            >
                                Today
                            </button>
                        </div>
                    </div>

                    {newRequestsCount > 0 && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm font-semibold flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            {newRequestsCount} new reservation request{newRequestsCount > 1 ? "s" : ""} waiting for quick action.
                        </div>
                    )}

                    {filteredBookings.length > 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Booking ID</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Guest Details</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Guests</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredBookings.map((booking) => (
                                        <tr key={booking._id} className={`hover:bg-slate-50/50 transition-colors ${isNewRequest(booking) ? "bg-amber-50/40" : ""}`}>
                                            <td className="px-6 py-4 font-bold text-slate-700">#{booking.bookingId}</td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-slate-900">{booking.user?.name}</p>
                                                    <p className="text-xs text-slate-500">{booking.user?.phone || 'No phone'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                                        <Calendar className="w-4 h-4 text-slate-400" />
                                                        {new Date(booking.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                                        <Clock className="w-4 h-4 text-slate-400" />
                                                        {booking.timeSlot}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                                    <Users className="w-4 h-4 text-slate-400" />
                                                    {booking.guests}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                {isNewRequest(booking) && (
                                                    <span className="inline-flex items-center rounded-md bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-bold uppercase">
                                                        New
                                                    </span>
                                                )}
                                                <Badge className={`rounded-lg px-2.5 py-1 ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                                    booking.status === 'checked-in' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' :
                                                        booking.status === 'completed' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                                                            'bg-red-100 text-red-700 hover:bg-red-200'
                                                    }`}>
                                                    {booking.status}
                                                </Badge>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {booking.status === 'confirmed' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(booking._id, 'checked-in')}
                                                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors"
                                                        >
                                                            Check-in
                                                        </button>
                                                    )}
                                                    {booking.status === 'checked-in' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(booking._id, 'completed')}
                                                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                                                        >
                                                            Check-out
                                                        </button>
                                                    )}
                                                    {booking.specialRequest && (
                                                        <button
                                                            title={booking.specialRequest}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        >
                                                            <MessageSquare className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">No reservations found</h3>
                            <p className="text-slate-500 mt-2">When guests book a table, they will appear here.</p>
                        </div>
                    )}
                </div>
                )}
            </div>
        </div>
    )
}

