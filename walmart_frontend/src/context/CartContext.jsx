// src/context/CartContext.jsx
import React, { createContext, useReducer, useContext } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItem = state.find(item => item.id === action.payload.id);
      if (existingItem) {
        // Jika item sudah ada, tambah quantity
        return state.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // Jika item baru, tambahkan ke keranjang dengan quantity 1
      return [...state, { ...action.payload, quantity: 1 }];
    }
    // (Anda bisa menambahkan case 'DECREASE_QUANTITY', 'REMOVE_ITEM', 'CLEAR_CART' di sini)
    default:
      return state;
  }
};

const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, []);

  return (
    <CartContext.Provider value={{ cart, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook agar lebih mudah digunakan
const useCart = () => useContext(CartContext);

export { CartContext, CartProvider, useCart };