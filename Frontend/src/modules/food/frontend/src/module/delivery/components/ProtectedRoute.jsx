import { Navigate } from "react-router-dom"

export default function ProtectedRoute({ children }) {
  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem("delivery_authenticated") === "true"

  if (!isAuthenticated) {
    return <Navigate to="/food/delivery/login" replace />
  }

  return children
}


