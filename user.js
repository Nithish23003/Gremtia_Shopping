// Firestore REST API credentials
const user_PROJECT_ID="loginin-a8a50";
const PROJECT_ID = 'inventory-89c39'; // your project ID
const COLLECTION_NAME = 'products'; // Firestore collection name where products are stored
const CART_COLLECTION_NAME = 'cart'; // Firestore collection name for storing user carts
const ORDER_COLLECTION_NAME = 'orders';
let cart = [];
let products = []; // Declare products array globally

// Fetch the product data from Firestore
async function fetchProducts() {
    const apiUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}`;
    try {
        let response = await fetch(apiUrl);
        let data = await response.json();

        console.log('Firestore API Response:', data);

        if (data.documents) {
            products = data.documents; // Store fetched products in the global array
            renderProducts(products);
        } else {
            console.error('No documents found in Firestore response');
        }
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

// Call fetchProducts on page load
window.onload = async () => {
    await fetchProducts();
    await loadCart(); // Load cart from Firestore on page load
    //await fetchUserCreditLimit(); // Fetch user credit limit on page load
};


// Render products into the HTML
function renderProducts(productsData) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';

    productsData.forEach(product => {
        const productData = product.fields;

        // Accessing fields from your provided product structure
        const title = productData.title?.stringValue || 'No Title';
        const description = productData.description?.stringValue || 'No Description';
        const price = productData.price?.integerValue || productData.price?.doubleValue || '0';
        const imageUrl = productData.image_url?.stringValue || '';  // Image URL directly from the field
        const itemId = product.name.split('/').pop();  // Extract item ID from Firestore document name

        console.log('Rendering product:', title, description, price, imageUrl);  // Log each product's details for debugging

        // Constructing product card HTML
        const productHTML = `
            <div class="product-card">
                <img src="${imageUrl}" alt="${title}">
                <h2>${title}</h2>
                <p>${description}</p>
                <p class="price">$${price}</p>
                <button class="add-to-cart" data-id="${itemId}">Add to Cart</button>
            </div>
        `;
        productList.innerHTML += productHTML;
    });

    // Add to cart functionality
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.onclick = (e) => addToCart(e.target.dataset.id);
    });
}

// Function to add product to cart
async function addToCart(productId) { 
    // Fetch the product data from Firestore to check its quantity
    const apiUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}/${productId}`;
    
    try {
        let response = await fetch(apiUrl);
        if (!response.ok) {
            console.error('Error fetching product data:', response.statusText);
            return; // Exit if there's an error fetching the product
        }

        let productData = await response.json();
        const productQuantity = productData.fields.quantity.integerValue || productData.fields.quantity.doubleValue;

        if (productQuantity <= 0) {
            alert('This product is out of stock.'); // Alert user if the product is out of stock
            return; // Exit if product is out of stock
        }

        // Proceed to add the product to the cart
        const existingProduct = cart.find(item => item.id === productId);
        if (!existingProduct) {
            cart.push({
                id: productId,
                title: productData.fields.title.stringValue,
                price: productData.fields.price.integerValue || productData.fields.price.doubleValue,
                imageUrl: productData.fields.image_url.stringValue,
                quantity: 1
            });
        } else {
            existingProduct.quantity += 1; // Increase quantity if already in cart
        }

        // Reduce the product quantity in the database
        await updateProductQuantity(productId, productQuantity - 1); // Reduce quantity by 1

        saveCart(); // Save cart to Firestore after adding
        renderCart(); // Update the cart display
    } catch (error) {
        console.error('Error adding to cart:', error);
    }
}

// Function to update only the product quantity in Firestore without affecting other fields
async function updateProductQuantity(productId, newQuantity) {
    const productData = {
        "fields": {
            "quantity": { "integerValue": newQuantity }
        }
    };

    try {
        const apiUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}/${productId}?updateMask.fieldPaths=quantity`;
        const response = await fetch(apiUrl, {
            method: 'PATCH', // Use PATCH to update only the specified field
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData) // Send only the field you want to update
        });

        if (response.ok) {
            console.log('Product quantity updated successfully!');
        } else {
            console.error('Error updating product quantity:', response.statusText);
        }
    } catch (error) {
        console.error('Error updating product quantity:', error);
    }
}

// Save cart to Firestore
async function saveCart() {
    const userId = localStorage.getItem('loggedInUserId'); // Get logged-in user ID

    if (userId) {
        // Prepare cart data in the correct Firestore format
        const cartData = {
            fields: {
                items: {
                    arrayValue: {
                        values: cart.map(item => ({
                            mapValue: {
                                fields: {
                                    id: { stringValue: item.id },
                                    title: { stringValue: item.title },
                                    price: { integerValue: item.price }, // Assuming price is an integer. Use doubleValue for decimals
                                    imageUrl: { stringValue: item.imageUrl },
                                    quantity: { integerValue: item.quantity }
                                }
                            }
                        }))
                    }
                }
            }
        };

        try {
            const apiUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${CART_COLLECTION_NAME}/${userId}`;
            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cartData)  // Send the correctly formatted Firestore data
            });

            if (response.ok) {
                console.log('Cart saved successfully!');
            } else {
                console.error('Error saving cart:', response.statusText);
            }
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    } else {
        console.error('User not logged in, cannot save cart.');
    }
}

// Load cart from Firestore
async function loadCart() {
    const userId = localStorage.getItem('loggedInUserId');

    if (userId) {
        const apiUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${CART_COLLECTION_NAME}/${userId}`;
        try {
            const response = await fetch(apiUrl);
            if (response.ok) {
                const data = await response.json();

                // Assuming the Firestore document structure has an array of items
                if (data.fields && data.fields.items && data.fields.items.arrayValue.values) {
                    cart = data.fields.items.arrayValue.values.map(item => ({
                        id: item.mapValue.fields.id.stringValue,
                        title: item.mapValue.fields.title.stringValue,
                        price: Number(item.mapValue.fields.price.integerValue || item.mapValue.fields.price.doubleValue), // Ensure price is a number
                        imageUrl: item.mapValue.fields.imageUrl.stringValue,
                        quantity: Number(item.mapValue.fields.quantity.integerValue) // Ensure quantity is a number
                    }));
                }

                renderCart(); // Refresh the cart display
            } else {
                console.error('Error loading cart:', response.statusText);
            }
        } catch (error) {
            console.error('Error loading cart:', error);
        }
    } else {
        console.error('User not logged in, cannot load cart.');
    }
}

// Render cart items
function renderCart() {
    const cartList = document.getElementById('cart-list');
    cartList.innerHTML = ''; // Clear previous cart items

    if (cart.length === 0) {
        cartList.innerHTML = '<p>Your cart is empty.</p>';
        return;
    }

    let totalAmount = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;

        const productHTML = `
            <div class="cart-item">
                <img src="${item.imageUrl}" alt="${item.title}">
                <h2>${item.title}</h2>
                <p>Price: ₹${item.price}</p>
                <p>Quantity: 
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                    ${item.quantity}
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                </p>
                <p>Total: ₹${itemTotal}</p>
            </div>
        `;
        cartList.innerHTML += productHTML;
    });

    // Display total and proceed to payment button
    cartList.innerHTML += `
        <div class="cart-summary">
            <h3>Total Amount: ₹${totalAmount}</h3>
            <button id="proceed-payment-btn">Proceed to Payment</button>
        </div>
    `;

    // Attach event listener for payment
    document.getElementById('proceed-payment-btn').onclick = showPaymentOptions;
}

// Function to update the quantity of items in the cart
function updateQuantity(itemId, change) {
    const product = cart.find(item => item.id === itemId);

    if (product) {
        // Ensure quantity is treated as a number
        product.quantity = Number(product.quantity) + change;

        // Remove the product if quantity falls below or equals zero
        if (product.quantity <= 0) {
            cart = cart.filter(item => item.id !== itemId);
        }

        saveCart(); // Save updated cart to Firestore
        renderCart(); // Update cart display
    }
}


// Show payment options and check credit limit
async function showPaymentOptions() {
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const userId = localStorage.getItem('loggedInUserId');

    // Fetch current user credit limit from Firestore
    let userCreditLimit = 0;
    if (userId) {
        const userApiUrl = `https://firestore.googleapis.com/v1/projects/${user_PROJECT_ID}/databases/(default)/documents/users/${userId}`;
        const response = await fetch(userApiUrl);
        if (response.ok) {
            const data = await response.json();
            userCreditLimit = parseInt(data.fields.creditLimit?.integerValue || 0);
        }
    }

    const paymentOptions = `
        <div id="payment-options">
            <h2>Choose Payment Method:</h2>
            <button id="credit-card-payment">Credit Card</button>
            <button id="cash-on-delivery">Cash on Delivery</button>
            <button id="credit-limit-payment" ${userCreditLimit < 1000 ? 'disabled' : ''}>Credit Limit</button>
        </div>
    `;
    document.getElementById('cart-list').innerHTML = paymentOptions;

    // Process payment for Credit Card
    document.getElementById('credit-card-payment').onclick = () => processPayment('Credit Card', totalAmount);

    // Process payment for Cash on Delivery
    document.getElementById('cash-on-delivery').onclick = () => processPayment('Cash on Delivery', totalAmount);

    // Process payment for Credit Limit
    document.getElementById('credit-limit-payment').onclick = async () => {
        if (userCreditLimit >= 1000) {
            if (totalAmount <= userCreditLimit) {
                // Proceed with Credit Limit payment
                updateUserCreditLimit(userCreditLimit - totalAmount); // Update credit limit in database
                processPayment('Credit Limit', totalAmount);
            } else {
                alert('Your total amount exceeds your credit limit. Please reduce your cart or increase your credit limit.');
            }
        } else {
            alert("You don't have enough Credit points.");
        }
    };
}

// Process payment and update credit limit
async function processPayment(paymentType, totalAmount) {
    const userId = localStorage.getItem('loggedInUserId');
    if (userId) {
        const orderData = {
            fields: {
                userId: { stringValue: userId },
                totalAmount: { integerValue: totalAmount },
                paymentType: { stringValue: paymentType },
                orderDate: { stringValue: new Date().toISOString() },
                cartItems: {
                    arrayValue: {
                        values: cart.map(item => ({
                            mapValue: {
                                fields: {
                                    id: { stringValue: item.id },
                                    title: { stringValue: item.title },
                                    price: { integerValue: item.price },
                                    quantity: { integerValue: item.quantity },
                                    imageUrl: { stringValue: item.imageUrl }
                                }
                            }
                        }))
                    }
                }
            }
        };

        // Send the order data to Firestore
        try {
            const orderApiUrl = `https://firestore.googleapis.com/v1/projects/${user_PROJECT_ID}/databases/(default)/documents/${ORDER_COLLECTION_NAME}`;
            const response = await fetch(orderApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                console.log('Order placed successfully!');
                alert('Your order has been placed successfully!');
                cart = []; // Clear the cart after placing the order
                await saveCart(); // Save empty cart to Firestore
                renderCart(); // Update cart display
                
                // Update user's credit limit after placing the order
                if (paymentType === 'Credit Limit') {
                    await updateUserCreditLimit(0); // Set credit limit to 0 after using Credit Limit
                } else {
                    await updateUserCreditLimit(100); // Increase credit limit by 100 for other payments
                }
            } else {
                console.error('Error placing order:', response.statusText);
            }
        } catch (error) {
            console.error('Error processing payment:', error);
        }
    } else {
        console.error('User not logged in, cannot process payment.');
    }
}


// Function to update user credit limit using REST API
async function updateUserCreditLimit(increment) {
    const userId = localStorage.getItem('loggedInUserId');
    if (!userId) {
        console.error('User ID is not available.');
        return;
    }

    const userApiUrl = `https://firestore.googleapis.com/v1/projects/${user_PROJECT_ID}/databases/(default)/documents/users/${userId}`;
    console.log('Fetching user data from:', userApiUrl);

    try {
        // Fetch the user's current data
        const response = await fetch(userApiUrl);
        if (!response.ok) {
            console.error('Error fetching user data:', response.statusText);
            return;
        }

        const data = await response.json();
        console.log('Fetched data:', data);

        // Get existing fields
        const existingCreditLimit = parseInt(data.fields.creditLimit?.integerValue || 0); // Ensure it's a number
        const newCreditLimit = existingCreditLimit + increment; // Update credit limit based on increment

        // Prepare the updated user data
        const updatedUserData = {
            fields: {
                email: data.fields.email,
                firstName: data.fields.firstName,
                lastName: data.fields.lastName,
                mobileNumber: data.fields.mobileNumber,
                creditLimit: { integerValue: newCreditLimit } // Update credit limit
            }
        };

        // Update the user's credit limit in Firestore
        const updateResponse = await fetch(userApiUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedUserData)
        });

        if (updateResponse.ok) {
            console.log('User credit limit updated successfully!');
        } else {
            console.error('Error updating credit limit:', updateResponse.statusText);
        }
    } catch (error) {
        console.error('Error updating user credit limit:', error);
    }
}



async function fetchOrders() {
    const userId = localStorage.getItem('loggedInUserId');
    const apiUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/orders`;

    try {
        let response = await fetch(apiUrl);
        let data = await response.json();
        console.log('Fetched data:', data); // Log the fetched data
        const ordersList = document.getElementById('order-list');
        ordersList.innerHTML = '';

        if (data.documents && data.documents.length > 0) {
            const userOrders = data.documents.filter(doc => doc.fields.userId && doc.fields.userId.stringValue === userId); // Filter orders for the logged-in user

            if (userOrders.length > 0) {
                userOrders.forEach(doc => {
                    const orderData = doc.fields;

                    const orderDate = orderData.orderDate ? new Date(orderData.orderDate.stringValue).toLocaleDateString() : 'N/A'; // Display formatted date
                    const paymentMethod = orderData.paymentType ? orderData.paymentType.stringValue : 'N/A';
                    const totalAmount = orderData.totalAmount ? parseInt(orderData.totalAmount.integerValue, 10) : 0; // Ensure it is an integer
                    const items = orderData.cartItems ? orderData.cartItems.arrayValue.values : []; // Adjust as necessary based on your data structure

                    let itemsHTML = items.map(item => {
                        const imageUrl = item.mapValue.fields.imageUrl ? item.mapValue.fields.imageUrl.stringValue : '';
                        const title = item.mapValue.fields.title ? item.mapValue.fields.title.stringValue : '';
                        const quantity = item.mapValue.fields.quantity ? item.mapValue.fields.quantity.integerValue : 0;
                        const price = item.mapValue.fields.price ? item.mapValue.fields.price.integerValue : 0;

                        return `
                            <div>
                                <img src="${imageUrl}" alt="${title}" style="width: 100px;">
                                <p>${title} (x${quantity}) - ₹${price * quantity}</p>
                            </div>
                        `;
                    }).join('');

                    const orderHTML = `
                        <div class="order">
                            <h3>Order Date: ${orderDate}</h3>
                            ${itemsHTML}
                            <p><strong>Total: ₹${totalAmount}</strong></p>
                            <p><strong>Payment Method: ${paymentMethod}</strong></p>
                        </div>
                    `;

                    ordersList.innerHTML += orderHTML;
                });
            } else {
                ordersList.innerHTML = '<p>No orders placed yet.</p>';
            }
        } else {
            ordersList.innerHTML = '<p>No orders placed yet.</p>';
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
}

// Navigation logic for tabs
const homeSection = document.getElementById('home-section');
const searchSection = document.getElementById('search-section');
const ordersSection = document.getElementById('orders-section');
const profileSection = document.getElementById('profile-section');
const cartSection = document.getElementById('cart-section');

const homeTab = document.getElementById('home-tab');
const searchTab = document.getElementById('search-tab');
const ordersTab = document.getElementById('orders-tab');
const profileTab = document.getElementById('profile-tab');
const cartTab = document.getElementById('cart-tab');

// Show and hide sections based on tab clicks
homeTab.onclick = () => showSection(homeSection);
searchTab.onclick = () => showSection(searchSection);
ordersTab.onclick = () => {
    showSection(ordersSection);
    fetchOrders(); // Fetch orders when the orders section is opened
};
profileTab.onclick = () => showSection(profileSection);
cartTab.onclick = () => {
    showSection(cartSection);
    renderCart(); // Render cart items when the cart section is opened
};

function showSection(section) {
    homeSection.classList.add('hidden');
    searchSection.classList.add('hidden');
    ordersSection.classList.add('hidden');
    profileSection.classList.add('hidden');
    cartSection.classList.add('hidden');
    section.classList.remove('hidden');
}

// Search functionality
document.getElementById('search-input').addEventListener('input', function () {
    const query = this.value.toLowerCase();
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';

    if (query) {
        const filteredProducts = searchProducts(query); // Use the correct search function to filter products
        filteredProducts.forEach(product => {
            const productData = product.fields;
            const title = productData.title?.stringValue || 'No Title';
            const description = productData.description?.stringValue || 'No Description';
            const price = productData.price?.integerValue || productData.price?.doubleValue || '0';
            const imageUrl = productData.image_url?.stringValue || '';

            const productHTML = `
                <div class="product-card">
                    <img src="${imageUrl}" alt="${title}">
                    <h2>${title}</h2>
                    <p>${description}</p>
                    <p class="price">$${price}</p>
                </div>
            `;
            resultsContainer.innerHTML += productHTML;
        });
    }
});

// Filter products based on the search query
function searchProducts(query) {
    return products.filter(product => {
        const productData = product.fields;
        const title = productData.title?.stringValue.toLowerCase() || '';
        const description = productData.description?.stringValue.toLowerCase() || '';
        return title.includes(query) || description.includes(query);
    });
}


// Fetch profile data from Firebase
async function fetchProfile() {
    const email = localStorage.getItem('loggedInUserEmail'); // Get the logged-in user's email
    const apiUrl = `https://firestore.googleapis.com/v1/projects/loginin-a8a50/databases/(default)/documents/users`;

    try {
        // Fetch all users and filter by email
        let response = await fetch(apiUrl);
        let data = await response.json();
        
        const users = data.documents;
        let userProfile = null;

        // Loop through users to find the one with the matching email
        for (let user of users) {
            const userEmail = user.fields.email?.stringValue;
            if (userEmail === email) {
                userProfile = user.fields;
                break; // Exit loop once user is found
            }
        }

        if (userProfile) {
            const firstName = userProfile.firstName?.stringValue || 'No First Name';
            const lastName = userProfile.lastName?.stringValue || 'No Last Name';
            const mobileNumber = userProfile.mobileNumber?.stringValue || 'No Mobile Number';
            const creditLimit = userProfile.creditLimit?.integerValue || 0; // Default to 0 if not set

            const profileHTML = `
                <p>First Name: ${firstName}</p>
                <p>Last Name: ${lastName}</p>
                <p>Email: ${email}</p>
                <p>Mobile Number: ${mobileNumber}</p>
                <p>Credit Limit: ${creditLimit}</p>
            `;
            document.getElementById('profile-info').innerHTML = profileHTML;
        } else {
            console.error('User not found');
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}

// Call initial fetch functions
fetchProducts();
fetchProfile();

document.getElementById('logout-button').onclick = function() {
    // Clear localStorage or any user session data
    localStorage.removeItem('loggedInUserId');
    localStorage.removeItem('loggedInUserEmail');
    window.location.href = 'index.html'; // Redirect to index.html
};