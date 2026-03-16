import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  items: [], // [{ id, restaurantId, name, price, quantity, ... }]
}

const findItemIndex = (items, id, restaurantId) =>
  items.findIndex(
    (item) =>
      item.id === id &&
      (restaurantId == null || item.restaurantId === restaurantId),
  )

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action) {
      const { id, restaurantId, quantity = 1, ...rest } = action.payload || {}
      if (!id) return
      const idx = findItemIndex(state.items, id, restaurantId)
      if (idx === -1) {
        state.items.push({ id, restaurantId, quantity, ...rest })
      } else {
        state.items[idx].quantity += quantity
      }
    },
    removeItem(state, action) {
      const { id, restaurantId } = action.payload || {}
      state.items = state.items.filter(
        (item) =>
          !(item.id === id &&
            (restaurantId == null || item.restaurantId === restaurantId)),
      )
    },
    clearCart(state) {
      state.items = []
    },
    setCart(state, action) {
      state.items = Array.isArray(action.payload) ? action.payload : []
    },
  },
})

export const { addItem, removeItem, clearCart, setCart } = cartSlice.actions
export default cartSlice.reducer

