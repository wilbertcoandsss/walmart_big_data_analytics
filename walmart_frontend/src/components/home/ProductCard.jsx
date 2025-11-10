// src/components/home/ProductCard.jsx

import React from 'react';
import { Button } from '../common/Button';
import styles from './ProductCard.module.css';

// Gambar placeholder jika produk tidak memiliki gambar
const placeholderImage = 'https://via.placeholder.com/300x200.png?text=Walmart+Product';

/**
 * Komponen untuk menampilkan kartu produk.
 * @param {object} props
 * @param {object} props.product - Objek produk (id, name, category, price, imageUrl)
 * @param {function} props.onAddToCart - Fungsi yang dipanggil saat tombol "Add to Cart" diklik
 */
export const ProductCard = ({ product, onAddToCart }) => {
  // Handler internal untuk memanggil fungsi dari parent
  const handleAddToCartClick = () => {
    // Memastikan fungsi onAddToCart ada sebelum memanggilnya
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  return (
    <div className={styles.card}>
      <img 
        src={product.imageUrl || placeholderImage} 
        alt={product.name} 
        className={styles.cardImage} 
      />
      <div className={styles.cardBody}>
        <p className={styles.category}>{product.category}</p>
        <h3 className={styles.title}>{product.name}</h3>
        <p className={styles.price}>
          {product.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </p>
        <Button onClick={handleAddToCartClick}>
          Add to Cart
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;