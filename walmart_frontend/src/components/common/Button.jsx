// src/components/common/Button.jsx

import React from 'react';
import styles from './Button.module.css'; // Import styling

/**
 * Komponen Tombol Reusable
 * @param {object} props
 * @param {React.ReactNode} props.children - Teks atau elemen di dalam tombol
 * @param {function} props.onClick - Fungsi yang dijalankan saat diklik
 * @param {'primary' | 'secondary'} [props.variant='primary'] - Variasi gaya tombol
 * @param {string} [props.className] - Class CSS tambahan
 * @param {boolean} [props.disabled] - Kondisi disabled
 */
export const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
  
  // Menggabungkan class dasar, class varian, dan class tambahan
  const buttonClass = `${styles.button} ${styles[variant]} ${className}`;

  return (
    <button className={buttonClass} onClick={onClick} {...props}>
      {children}
    </button>
  );
};