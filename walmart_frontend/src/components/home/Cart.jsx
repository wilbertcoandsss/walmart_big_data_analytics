// src/components/home/Cart.jsx
import React, { useContext } from 'react';
import { CartContext } from '../../context/CartContext';
import { Button } from '../common/Button';
// import { kafkaService } from '../../api/kafkaService';

const Cart = () => {
  const { cart, dispatch } = useContext(CartContext);

  const handleCheckout = () => {
    // kafkaService.notifyCheckout({ cart, user: 'CUST123' });
    // dispatch({ type: 'CLEAR_CART' });
    alert('Checkout berhasil! (Notifikasi Kafka terkirim)');
  };

  return (
    <div className="cart-container">
      <h3>Your Cart</h3>
      {/* ... Logika untuk menampilkan item, tambah/kurang ... */}
      <Button onClick={handleCheckout}>Checkout</Button>
    </div>
  );
};

export default Cart;