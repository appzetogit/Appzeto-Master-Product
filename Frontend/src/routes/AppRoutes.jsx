import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import FoodApp from '../modules/food/frontend/src/App'

const RedirectToFood = () => {
  const location = useLocation()
  return <Navigate to={`/food${location.pathname}${location.search}`} replace />
}

const AppRoutes = () => {
  return (
    <Routes>
      {/* Root redirection to /food */}
      <Route path="/" element={<Navigate to="/food" replace />} />

      {/* Dynamic Redirects for direct access without /food prefix */}
      <Route path="/user/*" element={<RedirectToFood />} />
      <Route path="/restaurant/*" element={<RedirectToFood />} />
      <Route path="/admin/*" element={<RedirectToFood />} />
      <Route path="/delivery/*" element={<RedirectToFood />} />
      <Route path="/usermain/*" element={<RedirectToFood />} />
      <Route path="/routes" element={<RedirectToFood />} />
      <Route path="/profile/*" element={<RedirectToFood />} />
      <Route path="/cart/*" element={<RedirectToFood />} />
      <Route path="/orders/*" element={<RedirectToFood />} />

      {/* Food Module Integration */}
      <Route path="/food/*" element={<FoodApp />} />

      {/* Fallback */}
      <Route path="*" element={<div>404 - Page Not Found</div>} />
    </Routes>
  )
}

export default AppRoutes
