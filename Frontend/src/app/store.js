import { configureStore } from '@reduxjs/toolkit'
import appReducer from './slices/appSlice'
import authReducer from './slices/authSlice'
import cartReducer from './slices/cartSlice'

export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    cart: cartReducer,
  },
})

// Inferred types for hooks
export const getStoreState = () => store.getState()


export { useAuthStore } from '../core/auth/auth.store';
// Add other module stores here as they are created
// export { useFoodStore } from '../modules/Food/store/food.store';
