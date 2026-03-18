import { useState, useEffect, useRef } from "react"
import { Upload, Trash2, Image as ImageIcon, Loader2, AlertCircle, CheckCircle2, ArrowUp, ArrowDown, Layout, Link as LinkIcon, Tag, UtensilsCrossed, FileText, Edit, X } from "lucide-react"
import api, { adminAPI, uploadAPI } from "@food/api"
import { getModuleToken } from "@food/utils/auth"
import { Input } from "@food/components/ui/input"
import { Label } from "@food/components/ui/label"
import { Button } from "@food/components/ui/button"
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}


export default function DiningManagement() {
    const [activeTab, setActiveTab] = useState('categories')

    // Categories
    const [categories, setCategories] = useState([])
    const [categoriesLoading, setCategoriesLoading] = useState(true)
    const [categoriesUploading, setCategoriesUploading] = useState(false)
    const [categoriesDeleting, setCategoriesDeleting] = useState(null)
    const [categoryName, setCategoryName] = useState("")
    const [categoryFile, setCategoryFile] = useState(null)
    const [editingCategoryId, setEditingCategoryId] = useState(null)
    const [editingCategoryImageUrl, setEditingCategoryImageUrl] = useState("")
    const categoryFileInputRef = useRef(null)

    // Banners
    const [banners, setBanners] = useState([])
    const [bannersLoading, setBannersLoading] = useState(true)
    const [bannersUploading, setBannersUploading] = useState(false)
    const [bannersDeleting, setBannersDeleting] = useState(null)
    const [bannerFile, setBannerFile] = useState(null)
    const [bannerPercentageOff, setBannerPercentageOff] = useState("")
    const [bannerTagline, setBannerTagline] = useState("")
    const bannerFileInputRef = useRef(null)

    // Stories
    const [stories, setStories] = useState([])
    const [storiesLoading, setStoriesLoading] = useState(true)
    const [storiesUploading, setStoriesUploading] = useState(false)
    const [storiesDeleting, setStoriesDeleting] = useState(null)
    const [storyName, setStoryName] = useState("")
    const [storyFile, setStoryFile] = useState(null)
    const [editingStoryId, setEditingStoryId] = useState(null)
    const storyFileInputRef = useRef(null)

    // Restaurants
    const [restaurants, setRestaurants] = useState([])
    const [restaurantsLoading, setRestaurantsLoading] = useState(true)
    const [restaurantSearch, setRestaurantSearch] = useState("")
    const [savingRestaurantId, setSavingRestaurantId] = useState(null)

    // Common
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)

    const getAuthConfig = (additionalConfig = {}) => {
        const adminToken = getModuleToken('admin')
        if (!adminToken) return additionalConfig
        return {
            ...additionalConfig,
            headers: {
                ...additionalConfig.headers,
                Authorization: `Bearer ${adminToken.trim()}`,
            }
        }
    }

    useEffect(() => {
        fetchCategories()
        fetchDiningRestaurants()
    }, [])

    useEffect(() => {
        setError(null)
        setSuccess(null)

        if (activeTab === 'banners') {
            fetchBanners()
        }

        if (activeTab === 'stories') {
            fetchStories()
        }
    }, [activeTab])

    // ==================== CATEGORIES ====================
    const fetchCategories = async () => {
        try {
            setCategoriesLoading(true)
            const response = await adminAPI.getDiningCategories()
            if (response.data.success) setCategories(response.data.data.categories || [])
        } catch (err) { debugError(err) } finally { setCategoriesLoading(false) }
    }

    const resetCategoryForm = () => {
        setCategoryName("")
        setCategoryFile(null)
        setEditingCategoryId(null)
        setEditingCategoryImageUrl("")
        if (categoryFileInputRef.current) categoryFileInputRef.current.value = ""
    }

    const handleEditCategory = (category) => {
        setError(null)
        setSuccess(null)
        setEditingCategoryId(category._id)
        setCategoryName(category.name || "")
        setCategoryFile(null)
        setEditingCategoryImageUrl(category.imageUrl || "")
        if (categoryFileInputRef.current) categoryFileInputRef.current.value = ""
    }

    const handleSubmitCategory = async () => {
        const trimmedCategoryName = categoryName.trim()
        if (!trimmedCategoryName) return setError("Category name is required")
        if (!editingCategoryId && !categoryFile) return setError("Name and Image are required")

        try {
            setError(null)
            setSuccess(null)
            setCategoriesUploading(true)
            let imageUrl = editingCategoryImageUrl

            if (categoryFile) {
                const uploadResponse = await uploadAPI.uploadMedia(categoryFile, { folder: "appzeto/dining/categories" })
                imageUrl = uploadResponse?.data?.data?.url || ""
            }

            const response = editingCategoryId
                ? await adminAPI.updateDiningCategory(editingCategoryId, {
                    name: trimmedCategoryName,
                    ...(imageUrl ? { imageUrl } : {}),
                })
                : await adminAPI.createDiningCategory({
                    name: trimmedCategoryName,
                    imageUrl,
                })

            if (response.data.success) {
                setSuccess(editingCategoryId ? "Category updated successfully" : "Category created successfully")
                resetCategoryForm()
                fetchCategories()
            }
        } catch (err) { setError(err.response?.data?.message || (editingCategoryId ? "Failed to update category" : "Failed to create category")) }
        finally { setCategoriesUploading(false) }
    }

    const handleDeleteCategory = async (id) => {
        if (!window.confirm("Delete this category?")) return
        try {
            setCategoriesDeleting(id)
            await adminAPI.deleteDiningCategory(id)
            fetchCategories()
            fetchDiningRestaurants()
            setSuccess("Category deleted")
        } catch (err) { setError("Failed to delete category") }
        finally { setCategoriesDeleting(null) }
    }

    // ==================== RESTAURANTS ====================
    const fetchDiningRestaurants = async () => {
        try {
            setRestaurantsLoading(true)
            const response = await adminAPI.getDiningRestaurants()
            if (response.data.success) {
                setRestaurants(response.data.data.restaurants || [])
            }
        } catch (err) {
            debugError(err)
            setRestaurants([])
        } finally {
            setRestaurantsLoading(false)
        }
    }

    const handleRestaurantDiningUpdate = async (restaurantId, updates) => {
        try {
            setSavingRestaurantId(restaurantId)
            setError(null)

            const currentRestaurant = restaurants.find((item) => item._id === restaurantId)
            const nextPayload = {
                isEnabled: updates.isEnabled ?? currentRestaurant?.diningSettings?.isEnabled ?? false,
                maxGuests: updates.maxGuests ?? currentRestaurant?.diningSettings?.maxGuests ?? 6,
                categoryIds: updates.categoryIds ?? currentRestaurant?.categoryIds ?? [],
                primaryCategoryId: updates.primaryCategoryId ?? currentRestaurant?.primaryCategoryId ?? currentRestaurant?.categoryIds?.[0] ?? null,
            }

            const response = await adminAPI.updateRestaurantDiningSettings(restaurantId, nextPayload)
            if (response.data.success) {
                const updatedRestaurant = response.data.data.restaurant
                setRestaurants((prev) =>
                    prev.map((item) => (item._id === restaurantId ? updatedRestaurant : item))
                )
                setSuccess("Dining restaurant updated successfully")
            }
        } catch (err) {
            debugError(err)
            setError(err.response?.data?.message || "Failed to update dining restaurant")
        } finally {
            setSavingRestaurantId(null)
        }
    }

    // ==================== BANNERS ====================
    const fetchBanners = async () => {
        try {
            setBannersLoading(true)
            const response = await api.get('/food/hero-banners/dining', getAuthConfig())
            if (response.data.success) {
                setBanners(response.data.data.banners || [])
            } else {
                setBanners([])
            }
        } catch (err) {
            debugError(err)
            setBanners([])
        } finally { setBannersLoading(false) }
    }

    const handleSubmitBanner = async () => {
        setError(null)
        setSuccess(null)
        if (!bannerFile) {
            return setError("Banner image is required")
        }

        try {
            setBannersUploading(true)
            const formData = new FormData()
            formData.append('files', bannerFile)
            if (bannerTagline.trim()) formData.append('title', bannerTagline.trim())
            if (bannerPercentageOff.trim()) formData.append('ctaText', bannerPercentageOff.trim())

            const response = await api.post('/food/hero-banners/dining/multiple', formData, getAuthConfig({
                headers: { 'Content-Type': 'multipart/form-data' }
            }))

            if (response.data.success) {
                setSuccess("Dining page banner created successfully")
                resetBannerForm()
                fetchBanners()
            }
        } catch (err) { setError(err.response?.data?.message || "Failed to create dining page banner") }
        finally { setBannersUploading(false) }
    }

    const resetBannerForm = () => {
        setBannerFile(null)
        setBannerPercentageOff("")
        setBannerTagline("")
        if (bannerFileInputRef.current) bannerFileInputRef.current.value = ""
    }

    const handleDeleteBanner = async (id) => {
        if (!window.confirm("Delete this banner?")) return
        try {
            setBannersDeleting(id)
            await api.delete(`/food/hero-banners/dining/${id}`, getAuthConfig())
            fetchBanners()
            setSuccess("Banner deleted")
        } catch (err) { setError("Failed to delete banner") }
        finally { setBannersDeleting(null) }
    }

    // ==================== STORIES ====================
    const fetchStories = async () => {
        try {
            setStoriesLoading(true)
            const response = await api.get('/admin/dining/stories', getAuthConfig())
            if (response.data.success) {
                setStories(response.data.data.stories || [])
            } else {
                setStories([])
            }
        } catch (err) {
            debugError(err)
            setStories([])
        } finally { setStoriesLoading(false) }
    }

    const handleSubmitStory = async () => {
        setError(null)
        setSuccess(null)
        if (!editingStoryId && (!storyName || !storyFile)) return setError("Name and Image are required")
        if (editingStoryId && !storyName) return setError("Name is required")

        try {
            setStoriesUploading(true)
            const formData = new FormData()
            formData.append('name', storyName)
            if (storyFile) formData.append('image', storyFile)

            let response;
            if (editingStoryId) {
                response = await api.put(`/admin/dining/stories/${editingStoryId}`, formData, getAuthConfig({
                    headers: { 'Content-Type': 'multipart/form-data' }
                }))
            } else {
                response = await api.post('/admin/dining/stories', formData, getAuthConfig({
                    headers: { 'Content-Type': 'multipart/form-data' }
                }))
            }

            if (response.data.success) {
                setSuccess(editingStoryId ? "Story updated successfully" : "Story created successfully")
                resetStoryForm()
                fetchStories()
            }
        } catch (err) { setError(err.response?.data?.message || (editingStoryId ? "Failed to update story" : "Failed to create story")) }
        finally { setStoriesUploading(false) }
    }

    const resetStoryForm = () => {
        setStoryName("")
        setStoryFile(null)
        setEditingStoryId(null)
        if (storyFileInputRef.current) storyFileInputRef.current.value = ""
    }

    const handleEditStory = (story) => {
        setEditingStoryId(story._id)
        setStoryName(story.name)
        setStoryFile(null)
        if (storyFileInputRef.current) storyFileInputRef.current.value = ""
    }

    const handleDeleteStory = async (id) => {
        if (!window.confirm("Delete this story?")) return
        try {
            setStoriesDeleting(id)
            await api.delete(`/admin/dining/stories/${id}`, getAuthConfig())
            fetchStories()
            setSuccess("Story deleted")
        } catch (err) { setError("Failed to delete story") }
        finally { setStoriesDeleting(null) }
    }

    const tabs = [
        { id: 'categories', label: 'Dining Categories', icon: Layout },
        { id: 'restaurants', label: 'Dining Restaurants', icon: LinkIcon },
        { id: 'banners', label: 'Dining Banners', icon: ImageIcon },
        { id: 'stories', label: 'Dining Stories', icon: FileText },
    ]

    const filteredRestaurants = restaurants.filter((restaurant) => {
        const query = restaurantSearch.trim().toLowerCase()
        if (!query) return true
        return (
            String(restaurant.name || restaurant.restaurantName || "").toLowerCase().includes(query) ||
            String(restaurant.ownerName || "").toLowerCase().includes(query) ||
            String(restaurant.zone || "").toLowerCase().includes(query)
        )
    })

    return (
        <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                            <UtensilsCrossed className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Dining Management</h1>
                            <p className="text-sm text-slate-600 mt-1">Manage dining categories, restaurant links, banners, and stories</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-6">
                    <div className="flex gap-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Messages */}
                {success && <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2 max-w-2xl"><CheckCircle2 className="w-5 h-5" />{success}</div>}
                {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2 max-w-2xl"><AlertCircle className="w-5 h-5" />{error}</div>}

                {/* Content */}
                {activeTab === 'categories' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <h2 className="text-lg font-bold text-slate-900">{editingCategoryId ? "Edit Category" : "Add Category"}</h2>
                                    {editingCategoryId && (
                                        <Button type="button" variant="outline" onClick={resetCategoryForm} className="gap-2">
                                            <X className="w-4 h-4" />
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <Label>Name</Label>
                                        <Input value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="Category Name" className="mt-1" />
                                    </div>
                                    <div>
                                        <Label>{editingCategoryId ? "Replace Image" : "Image"}</Label>
                                        <Input type="file" ref={categoryFileInputRef} onChange={e => setCategoryFile(e.target.files[0])} accept="image/*" className="mt-1" />
                                        {editingCategoryId && editingCategoryImageUrl && !categoryFile && (
                                            <div className="mt-3">
                                                <img src={editingCategoryImageUrl} alt={categoryName || "Current category"} className="w-24 h-24 rounded-lg object-cover border border-slate-200" />
                                                <p className="text-xs text-slate-500 mt-2">Current image will be kept unless you select a new one.</p>
                                            </div>
                                        )}
                                    </div>
                                    <Button onClick={handleSubmitCategory} disabled={categoriesUploading} className="w-full bg-blue-600 hover:bg-blue-700">
                                        {categoriesUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingCategoryId ? "Update Category" : "Create Category")}
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h2 className="text-lg font-bold text-slate-900 mb-4">Categories List</h2>
                                {categoriesLoading ? <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div> : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {categories.map(cat => (
                                            <div key={cat._id} className="border rounded-lg overflow-hidden group relative">
                                                <img src={cat.imageUrl} alt={cat.name} className="w-full h-32 object-cover" />
                                                <div className="p-3 bg-white">
                                                    <p className="font-medium text-slate-900">{cat.name}</p>
                                                </div>
                                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditCategory(cat)} className="p-1.5 bg-blue-100 text-blue-600 rounded-full">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteCategory(cat._id)} className="p-1.5 bg-red-100 text-red-600 rounded-full">
                                                        {categoriesDeleting === cat._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {categories.length === 0 && <p className="text-slate-500 text-center col-span-full py-8">No categories found.</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'restaurants' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Dining Restaurants</h2>
                                <p className="text-sm text-slate-500 mt-1">Link restaurants to dining categories from this page.</p>
                            </div>
                            <div className="relative w-full sm:w-80">
                                <Input
                                    value={restaurantSearch}
                                    onChange={(e) => setRestaurantSearch(e.target.value)}
                                    placeholder="Search restaurants..."
                                    className="pl-10"
                                />
                                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        {restaurantsLoading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px]">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Restaurant</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Zone</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Dining</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Category</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Max Guests</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRestaurants.map((restaurant) => (
                                            <tr key={restaurant._id} className="border-b border-slate-100">
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-900">{restaurant.name || restaurant.restaurantName}</span>
                                                        <span className="text-xs text-slate-500">{restaurant.ownerName || "No owner name"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-slate-600">{restaurant.zone || "N/A"}</td>
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={restaurant.diningSettings?.isEnabled === true}
                                                        onChange={(e) => handleRestaurantDiningUpdate(restaurant._id, {
                                                            isEnabled: e.target.checked,
                                                        })}
                                                        disabled={savingRestaurantId === restaurant._id}
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <select
                                                        value={restaurant.primaryCategoryId || restaurant.categoryIds?.[0] || ""}
                                                        onChange={(e) => handleRestaurantDiningUpdate(restaurant._id, {
                                                            categoryIds: e.target.value ? [e.target.value] : [],
                                                            primaryCategoryId: e.target.value || null,
                                                        })}
                                                        disabled={savingRestaurantId === restaurant._id}
                                                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    >
                                                        <option value="">Select category</option>
                                                        {categories.map((category) => (
                                                            <option key={category._id} value={category._id}>
                                                                {category.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max="100"
                                                        defaultValue={restaurant.diningSettings?.maxGuests || 6}
                                                        onBlur={(e) => handleRestaurantDiningUpdate(restaurant._id, {
                                                            maxGuests: parseInt(e.target.value, 10) || 6,
                                                        })}
                                                        disabled={savingRestaurantId === restaurant._id}
                                                        className="w-24"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    {savingRestaurantId === restaurant._id ? (
                                                        <span className="inline-flex items-center gap-2 text-sm text-blue-600">
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Saving
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-slate-500">
                                                            {restaurant.diningSettings?.isEnabled ? "Connected" : "Not enabled"}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredRestaurants.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                                                    No dining restaurants found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'banners' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h2 className="text-lg font-bold text-slate-900 mb-2">Add Dining Page Banner</h2>
                                <p className="text-sm text-slate-500 mb-4">
                                    This banner shows on the user dining page and is not linked to any restaurant.
                                </p>
                                <div className="space-y-4">
                                    <div>
                                        <Label>Image</Label>
                                        <Input
                                            type="file"
                                            ref={bannerFileInputRef}
                                            onChange={e => {
                                                setBannerFile(e.target.files[0] || null)
                                                setError(null)
                                            }}
                                            accept="image/*"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Promo Text</Label>
                                        <Input value={bannerPercentageOff} onChange={e => { setBannerPercentageOff(e.target.value); setError(null) }} placeholder="Optional, e.g. 50% OFF" className="mt-1" />
                                    </div>
                                    <div>
                                        <Label>Tagline</Label>
                                        <Input value={bannerTagline} onChange={e => { setBannerTagline(e.target.value); setError(null) }} placeholder="Optional, e.g. Weekend dining specials" className="mt-1" />
                                    </div>
                                    <Button onClick={handleSubmitBanner} disabled={bannersUploading} className="w-full bg-blue-600 hover:bg-blue-700">
                                        {bannersUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Banner"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h2 className="text-lg font-bold text-slate-900 mb-4">Dining Page Banners</h2>
                                {bannersLoading ? <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div> : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {banners.map(banner => (
                                            <div key={banner._id} className="border rounded-lg overflow-hidden group relative">
                                                <img src={banner.imageUrl} alt={banner.title || "Dining banner"} className="w-full h-32 object-cover" />
                                                <div className="p-3 bg-white">
                                                    {banner.ctaText && <p className="font-bold text-slate-900">{banner.ctaText}</p>}
                                                    {banner.title && <p className="text-sm text-slate-600">{banner.title}</p>}
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {banner.isActive === false ? "Inactive" : "Active on dining page"}
                                                    </p>
                                                </div>
                                                <button onClick={() => handleDeleteBanner(banner._id)} className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {bannersDeleting === banner._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        ))}
                                        {banners.length === 0 && <p className="text-slate-500 text-center col-span-full py-8">No banners found.</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'stories' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h2 className="text-lg font-bold text-slate-900 mb-4">{editingStoryId ? "Edit Story" : "Add Story"}</h2>
                                <div className="space-y-4">
                                    <div>
                                        <Label>Name</Label>
                                        <Input value={storyName} onChange={e => { setStoryName(e.target.value); setError(null) }} placeholder="Story Name" className="mt-1" />
                                    </div>
                                    <div>
                                        <Label>Image</Label>
                                        <Input
                                            type="file"
                                            ref={storyFileInputRef}
                                            onChange={e => {
                                                setStoryFile(e.target.files[0] || null)
                                                setError(null)
                                            }}
                                            accept="image/*"
                                            className="mt-1"
                                        />
                                    </div>
                                    <Button onClick={handleSubmitStory} disabled={storiesUploading} className="w-full bg-blue-600 hover:bg-blue-700">
                                        {storiesUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingStoryId ? "Update Story" : "Create Story")}
                                    </Button>
                                    {editingStoryId && (
                                        <Button onClick={resetStoryForm} variant="outline" className="w-full mt-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                                            Cancel Edit
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h2 className="text-lg font-bold text-slate-900 mb-4">Stories List</h2>
                                {storiesLoading ? <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div> : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {stories.map(story => (
                                            <div key={story._id} className="border rounded-lg overflow-hidden group relative">
                                                <img src={story.imageUrl} alt={story.name} className="w-full h-32 object-cover" />
                                                <div className="p-3 bg-white">
                                                    <p className="font-medium text-slate-900">{story.name}</p>
                                                </div>
                                                <button onClick={() => handleDeleteStory(story._id)} className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {storiesDeleting === story._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                                <button onClick={() => handleEditStory(story)} className="absolute top-2 right-10 p-1.5 bg-blue-100 text-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {stories.length === 0 && <p className="text-slate-500 text-center col-span-full py-8">No stories found.</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

