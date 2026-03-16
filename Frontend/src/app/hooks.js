import { useDispatch, useSelector } from 'react-redux'
import { getStoreState } from './store'

// Typed-ish helpers for convenience
export const useAppDispatch = () => useDispatch()
export const useAppSelector = useSelector

// Selector helpers
export const selectApp = (state = getStoreState()) => state.app
export const selectAuth = (state = getStoreState()) => state.auth
export const selectCart = (state = getStoreState()) => state.cart

