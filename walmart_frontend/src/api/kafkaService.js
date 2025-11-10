// src/api/kafkaService.js

// Alamat server Node.js/Kafka Anda
const KAFKA_API_URL = 'http://10.35.148.59:5001/send_to_kafka';

/**
 * Mengirim event login ke backend Kafka.
 */
const notifyLogin = async (userData) => {
    const payload = {
        event: 'USER_LOGIN',
        user: userData.email,
        timestamp: new Date().toISOString(),
    };

    try {
        const response = await fetch(KAFKA_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`Kafka API Error: ${response.statusText}`);

        console.log('Successfully sent login event to Kafka');
        return await response.json();
    } catch (error) {
        console.error('Failed to send login notification:', error);
    }
};

/**
 * Mengirim event registrasi ke backend Kafka.
 */
const notifyRegister = async (userData) => {
    const payload = {
        event: 'USER_REGISTER',
        user: userData.name,
        details: `New account created for ${userData.email}`,
        timestamp: new Date().toISOString(),
    };

    try {
        const response = await fetch(KAFKA_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`Kafka API Error: ${response.statusText}`);

        console.log('Successfully sent registration event to Kafka');
        return await response.json();
    } catch (error) {
        console.error('Failed to send registration notification:', error);
    }
};

/**
 * ✅ BARU: Mengirim event "add to cart" ke Kafka.
 */
const notifyAddToCart = async (cartData) => {
    const payload = {
        event: 'ADD_TO_CART',
        user: cartData.user || 'Anonymous',
        product: cartData.productName,
        category: cartData.category,
        details: `Added ${cartData.productName} to the cart.`,
        timestamp: new Date().toISOString(),
    };

    // ✅ LOGIKA FETCH DITAMBAHKAN DI SINI
    try {
        const response = await fetch(KAFKA_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`Kafka API Error: ${response.statusText}`);

        console.log('Successfully sent add_to_cart event to Kafka');
        return await response.json();
    } catch (error) {
        console.error('Failed to send add_to_cart notification:', error);
    }
};

/**
 * ✅ BARU: Mengirim event "checkout" ke Kafka.
 */
const notifyCheckout = async (checkoutData) => {
    const payload = {
        event: 'CHECKOUT',
        user: checkoutData.user,
        details: `Checkout with ${checkoutData.itemCount} items for $${checkoutData.totalPrice.toFixed(2)}.`,
        // ✅ Payload yang diperkaya dengan detail produk
        products: checkoutData.products,
        totalPrice: checkoutData.totalPrice,
        timestamp: new Date().toISOString(),
    };

    // ✅ LOGIKA FETCH DITAMBAHKAN DI SINI
    try {
        const response = await fetch(KAFKA_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`Kafka API Error: ${response.statusText}`);

        console.log('Successfully sent checkout event to Kafka');
        return await response.json();
    } catch (error) {
        console.error('Failed to send checkout notification:', error);
    }
};

export const kafkaService = {
    notifyLogin,
    notifyRegister,
    notifyAddToCart,
    notifyCheckout,
};