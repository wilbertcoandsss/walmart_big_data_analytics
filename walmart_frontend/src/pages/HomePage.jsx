// src/pages/HomePage.jsx

import React, { useState } from 'react';
import { ProductCard } from '../components/home/ProductCard';
import { Button } from '../components/common/Button';
import { kafkaService } from '../api/kafkaService';
import styles from './HomePage.module.css';
import { useAuth } from '../context/AuthContext';

// Sample product data based on your list
const MOCK_PRODUCTS = [
  { id: 1, name: 'Bread', category: 'Groceries', price: 3.50, imageUrl: 'https://theloopywhisk.com/wp-content/uploads/2024/08/Gluten-Free-Sandwich-Bread_1200px-2.jpg' },
  { id: 2, name: 'Headphones', category: 'Electronics', price: 129.99, imageUrl: 'https://img.id.my-best.com/product_images/1f0b9f65f30bbe53a0628fd4fbdb7867.png?ixlib=rails-4.3.1&q=70&lossless=0&w=240&h=240&fit=fill&fill=solid&fill-color=FFFFFF&s=fd02a08b76409b759a07db0105e5be42' },
  { id: 3, name: 'T-Shirt', category: 'Apparel', price: 19.99, imageUrl: 'https://highty.id/wp-content/uploads/2021/02/TC02-1w.jpg' },
  { id: 4, name: 'Milk', category: 'Groceries', price: 4.25, imageUrl: 'https://i5.walmartimages.com/seo/Great-Value-Whole-Vitamin-D-Milk-Gallon-Plastic-Jug-128-Fl-Oz_6a7b09b4-f51d-4bea-a01c-85767f1b481a.86876244397d83ce6cdedb030abe6e4a.jpeg' },
  { id: 5, name: 'Monitor', category: 'Electronics', price: 299.00, imageUrl: 'https://img.id.my-best.com/product_images/d28e3e8ada838e359f00f7f083b43879.jpeg?ixlib=rails-4.3.1&q=70&lossless=0&w=800&h=800&fit=clip&s=bd06886bb25a7be42a58d74af14149eb' },
  { id: 6, name: 'Jacket', category: 'Apparel', price: 89.50, imageUrl: 'https://images-cdn.ubuy.co.id/67d5b5339a868c1e6254fae0-tacvasen-men-39-s-jackets-bomber-jacket.jpg' },
  { id: 7, name: 'Vitamins', category: 'Pharmacy', price: 15.00, imageUrl: 'https://blackmores-bucket.s3.ap-southeast-1.amazonaws.com/blackmores/product/images689418d78069e.png' },
  { id: 8, name: 'Jeans', category: 'Apparel', price: 55.00, imageUrl: 'https://www.russ.co.id/cdn/shop/products/ginee_20230224120308401_6359727211_800x.jpg?v=1739796161' },
];

const HomePage = () => {
    const [cartItems, setCartItems] = useState([]);
    const { user } = useAuth(); // ✅ Dapatkan user yang sedang login
    
    const handleAddToCart = (product) => {
        setCartItems(prevItems => {
            const itemExists = prevItems.find(item => item.id === product.id);
            if (itemExists) {
                return prevItems.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevItems, { ...product, quantity: 1 }];
        });
        // Send notification to Kafka
kafkaService.notifyAddToCart({ 
            productName: product.name, 
            category: product.category, // Pass the category
            user: user ? user.name : 'Guest' 
        });
    };

    const handleQuantityChange = (productId, amount) => {
        setCartItems(prevItems => {
            return prevItems.map(item => {
                if (item.id === productId) {
                    const newQuantity = item.quantity + amount;
                    return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
                }
                return item;
            }).filter(Boolean); // Remove items that are null (quantity <= 0)
        });
    };

    const handleCheckout = () => {
        if (cartItems.length === 0) return;
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const checkoutPayload = {
            user: user ? user.name : 'Guest',
            itemCount: totalItems,
            totalPrice: totalPrice,
            // ✅ Kirim detail produk di keranjang
            products: cartItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                category: item.category
            }))
        };
        // Send notification to Kafka
        kafkaService.notifyCheckout(checkoutPayload);
        
        alert('Checkout successful! See the real-time log for the event.');
        setCartItems([]); // Clear the cart
    };
    
    const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <div className={styles.homeLayout}>
            <div className={styles.productGrid}>
                {MOCK_PRODUCTS.map(product => (
                    <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                ))}
            </div>

            <aside className={styles.cartSidebar}>
                <div className={styles.cartContainer}>
                    <h2>Shopping Cart</h2>
                    {cartItems.length === 0 ? (
                        <p className={styles.emptyCart}>Your cart is empty.</p>
                    ) : (
                        <div className={styles.cartItemsList}>
                            {cartItems.map(item => (
                                <div key={item.id} className={styles.cartItem}>
                                    <div className={styles.itemInfo}>
                                        <span>{item.name}</span>
                                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                    <div className={styles.quantityControl}>
                                        <button onClick={() => handleQuantityChange(item.id, -1)}>-</button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => handleQuantityChange(item.id, 1)}>+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className={styles.cartFooter}>
                        <div className={styles.cartTotal}>
                            <span>Total</span>
                            <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <Button onClick={handleCheckout} disabled={cartItems.length === 0}>
                            Checkout
                        </Button>
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default HomePage;