import { Link, useLocation } from "react-router-dom"
import { UtensilsCrossed, Tag, User, Truck } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function BottomNavigation() {
  const routerLocation = useLocation()
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = useRef(0)

  // Check active routes - support both /user/* and /* paths
  const isDining = routerLocation.pathname === "/food/dining" || routerLocation.pathname === "/food/user/dining"
  const isUnder250 = routerLocation.pathname === "/under-250" || routerLocation.pathname === "/food/user/under-250"
  const isProfile = routerLocation.pathname.startsWith("/food/profile") || routerLocation.pathname.startsWith("/food/user/profile")
  const isDelivery = !isDining && !isUnder250 && !isProfile && (routerLocation.pathname === "/" || routerLocation.pathname === "/food/user" || (routerLocation.pathname.startsWith("/") && !routerLocation.pathname.startsWith("/food/restaurant") && !routerLocation.pathname.startsWith("/food/delivery") && !routerLocation.pathname.startsWith("/food/admin") && !routerLocation.pathname.startsWith("/food/usermain")))

  // Reset visibility and scroll position when route changes
  useEffect(() => {
    setIsVisible(true)
    lastScrollY.current = window.scrollY
  }, [routerLocation.pathname])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollDifference = Math.abs(currentScrollY - lastScrollY.current)

      if (currentScrollY < 10) {
        setIsVisible(true)
        lastScrollY.current = currentScrollY
        return
      }

      if (scrollDifference < 10) return

      if (currentScrollY < lastScrollY.current) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY.current) {
        setIsVisible(false)
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [routerLocation.pathname])

  const navItems = [
    { id: 'delivery', label: 'Delivery', icon: Truck, path: '/food/user', active: isDelivery },
    { id: 'under-250', label: 'Under 250', icon: Tag, path: '/food/user/under-250', active: isUnder250 },
    { id: 'dining', label: 'Dining', icon: UtensilsCrossed, path: '/food/user/dining', active: isDining },
    { id: 'profile', label: 'Profile', icon: User, path: '/food/user/profile', active: isProfile },
  ]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md"
        >
          <div className="relative bg-white/80 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-2xl md:rounded-3xl p-2 flex items-center justify-between overflow-hidden">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className="relative flex-1 group"
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={`flex flex-col items-center justify-center py-2 relative z-10 transition-colors duration-300 ${
                      item.active ? 'text-primary-orange' : 'text-gray-500'
                    }`}
                  >
                    <Icon 
                      className={`h-5 w-5 mb-1 transition-transform duration-300 ${
                        item.active ? 'scale-110' : 'group-hover:scale-110'
                      }`} 
                      strokeWidth={item.active ? 2.5 : 2}
                    />
                    <span className={`text-[10px] font-bold tracking-tight uppercase ${
                      item.active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                    }`}>
                      {item.label}
                    </span>

                    {item.active && (
                      <motion.div
                        layoutId="activeBackground"
                        className="absolute inset-0 bg-primary-orange/10 rounded-xl -z-10"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30
                        }}
                      />
                    )}
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

