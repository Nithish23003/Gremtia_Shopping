// Firebase REST API configuration
const baseUrl = "https://firestore.googleapis.com/v1/projects/inventory-89c39/databases/(default)/documents/";

// Add an event listener to the logout button
document.getElementById('logoutBtn').onclick = function() {
    // Clear localStorage or any user session data
    localStorage.removeItem('loggedInUserId');
    localStorage.removeItem('loggedInUserEmail');
    window.location.href = 'index.html'; // Redirect to index.html
};


function uploadImage(file) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const fileName = encodeURIComponent(file.name);
        const url = `https://firebasestorage.googleapis.com/v0/b/inventory-89c39.appspot.com/o?name=${fileName}`;
        
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', file.type);
        
        xhr.onload = function () {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                // Construct the download URL
                const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/inventory-89c39.appspot.com/o/${fileName}?alt=media`;
                resolve(downloadUrl);
            } else {
                reject(new Error('Image upload failed: ' + xhr.responseText));
            }
        };

        xhr.onerror = function () {
            reject(new Error('An error occurred while uploading the image.'));
        };

        xhr.send(file);
    });
}

function saveProduct() {
    const cate_id = document.getElementById('cate_id').value;
    const item_id = document.getElementById('item_id').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const quantity = document.getElementById('quantity').value;
    const price = document.getElementById('price').value;
    const imageFile = document.getElementById('imageInput').files[0]; // Corrected to 'imageInput'

    if (!cate_id || !item_id || !title || !description || !quantity || !price || !imageFile ) {
        alert("Please enter the product details.");
        return;
    }

    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner'; // Make sure to define this in your CSS
    document.body.appendChild(spinner);

    uploadImage(imageFile) // Call the uploadImage function
        .then(downloadUrl => {
            const productData = {
                fields: {
                    cate_id: { stringValue: cate_id },
                    item_id: { stringValue: item_id },
                    title: { stringValue: title },
                    description: { stringValue: description },
                    quantity: { integerValue: parseInt(quantity) },
                    price: { doubleValue: parseFloat(price) },
                    image_url: { stringValue: downloadUrl } // Add the image URL to product data
                }
            };

            const url = `${baseUrl}products/${cate_id}_${item_id}`;
            return fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
        })
        .then(response => response.json())
        .then(data => {
            alert("Product added/updated successfully!");
            document.getElementById('productForm').reset(); // Reset the form after successful operation
        })
        .catch(error => {
            console.error("Error adding/updating product:", error);
        })
        .finally(() => {
            spinner.remove(); // Remove loading spinner
        });
}


// Function to delete product using REST API
async function deleteProduct(cate_id, item_id) {
    // Check if the IDs are provided
    if (!cate_id || !item_id) {
        alert("Please enter both Category Name and Item Name.");
        return;
    }

    // Ask for confirmation before deleting
    const confirmation = confirm("Are you sure you want to delete this product?");
    
    if (confirmation) {
        const productUrl = `${baseUrl}products/${cate_id}_${item_id}`;
        const deletedProductUrl = `${baseUrl}deleted_products/${cate_id}_${item_id}`; // URL for deleted products

        try {
            // Step 1: Fetch the product details to save it before deleting
            const response = await fetch(productUrl);
            if (!response.ok) throw new Error("Error fetching product data for deletion.");

            const productData = await response.json();

            // Step 2: Store the product data in the deleted_products collection
            const deletedProductData = {
                fields: {
                    ...productData.fields,
                    deleted_at: { timestampValue: new Date().toISOString() }, // Add a timestamp of deletion
                }
            };

            await fetch(deletedProductUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(deletedProductData)
            });

            // Step 3: Delete the product from the original collection
            const deleteResponse = await fetch(productUrl, {
                method: 'DELETE'
            });

            if (deleteResponse.ok) {
                alert("Product deleted successfully!");
                getAllProducts(); // Refresh product list after deletion
            } else {
                alert("Error deleting product. Please check the IDs and try again.");
            }
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("An error occurred while deleting the product.");
        }
    } else {
        alert("Product deletion canceled.");
    }
}

// Global variables
let currentPage = 1;
const itemsPerPage = 5; 
let products = [];

// Fetch all products using REST API
function getAllProducts() {
    fetch(`${baseUrl}products`)
    .then(response => response.json())
    .then(data => {
        if (data.documents) {
            products = data.documents;
            displayProducts();
        } else {
            document.getElementById('productList').innerHTML = '<p>No products found</p>';
        }
    })
    .catch(error => {
        console.error("Error fetching products:", error);
    });
}

// Display products based on the current page
function displayProducts() {
    let productList = document.getElementById('productList');
    productList.innerHTML = '';

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedProducts = products.slice(start, end);

    const table = createProductTable(paginatedProducts);
    productList.appendChild(table);
    updatePaginationButtons();
}

function createProductTable(paginatedProducts) {
    const table = document.createElement('table');
    const header = `
        <tr>
            <th>Category Name</th>
            <th>Item Name</th>
            <th>Image</th>
            <th>Title</th>
            <th>Description</th>
            <th>Quantity</th>
            <th>Price</th>
        </tr>`;
    table.innerHTML = header;

    paginatedProducts.forEach(doc => {
        const product = doc.fields;
        const row = `
            <tr>
                <td>${product.cate_id.stringValue}</td>
                <td>${product.item_id.stringValue}</td>
                <td><img src="${product.image_url.stringValue}" alt="${product.title.stringValue}"></td>
                <td>${product.title.stringValue}</td>
                <td>${product.description.stringValue}</td>
                <td>${product.quantity.integerValue}</td>
                <td>${product.price.doubleValue}</td>
            </tr>`;
        table.innerHTML += row;
    });

    return table;
}

// Pagination functions for all products
function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayProducts();
    }
}

function nextPage() {
    if (currentPage < Math.ceil(products.length / itemsPerPage)) {
        currentPage++;
        displayProducts();
    }
}

function updatePaginationButtons() {
    document.getElementById('prevBtn').style.display = currentPage === 1 ? 'none' : 'inline-block';
    document.getElementById('nextBtn').style.display = currentPage === Math.ceil(products.length / itemsPerPage) ? 'none' : 'inline-block';
}


// Fetch products by category
function getProductsByCategory() {
    const cate_id = prompt("Enter Category ID:");
    fetch(`${baseUrl}products`)
    .then(response => response.json())
    .then(data => {
        if (data.documents) {
            productsByCategory = data.documents.filter(doc => doc.fields.cate_id.stringValue === cate_id);
            if (productsByCategory.length > 0) {
                currentCategoryPage = 1;
                displayCategoryProducts();
            } else {
                document.getElementById('productList').innerHTML = `<p>No products found in category ${cate_id}</p>`;
            }
        } else {
            document.getElementById('productList').innerHTML = '<p>No products found</p>';
        }
    })
    .catch(error => {
        console.error("Error fetching products:", error);
    });
}

function displayCategoryProducts() {
    let productList = document.getElementById('productList');
    productList.innerHTML = '';

    const start = (currentCategoryPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedProducts = productsByCategory.slice(start, end);

    const table = createProductTable(paginatedProducts);
    productList.appendChild(table);
}


// Fetch product by ID
function getProductById() {
    const cate_id = prompt("Enter Category ID:");
    const item_id = prompt("Enter Item ID:");
    const url = `${baseUrl}products/${cate_id}_${item_id}`;

    fetch(url)
    .then(response => response.json())
    .then(doc => {
        let productList = document.getElementById('productList');
        productList.innerHTML = '';

        if (doc.fields) {
            const table = createProductTable([doc]);
            productList.appendChild(table);
        } else {
            productList.innerHTML = '<p>No product found</p>';
        }
    })
    .catch(error => {
        console.error("Error fetching product:", error);
    });
}


// Define the base URL for your Firestore REST API
const projectID = "loginin-a8a50";  // Your project ID
const userUrl = `https://firestore.googleapis.com/v1/projects/${projectID}/databases/(default)/documents/users/`;

// Function to change user credit limit by email
function changeUserCreditLimit() {
    const email = document.getElementById('userEmail').value.trim();

    if (!email) {
        alert("Please enter the user's email.");
        return;
    }

    fetch(`${userUrl}`)  // Fetch users collection
    .then(response => response.json())
    .then(data => {
        // Check if documents are available
        if (data.documents) {
            const user = data.documents.find(doc => {
                // Check if the email field exists before trying to access its value
                return doc.fields && doc.fields.email && doc.fields.email.stringValue === email;
            });

            if (!user) {
                alert("No user found with this email.");
            } else {
                const currentCreditLimit = user.fields.creditLimit ? user.fields.creditLimit.integerValue : 0;
                document.getElementById('currentCreditLimit').textContent = `Current Credit Limit: ${currentCreditLimit}`;
                document.getElementById('updateCreditForm').style.display = 'block';

                // Set up the update button click handler
                document.getElementById('updateCreditLimitBtn').onclick = function() {
                    updateUserCreditLimit(user.name, user.fields); // Pass the entire user fields
                };
            }
        } else {
            alert("No user data found.");
        }
    })
    .catch(error => {
        console.error("Error fetching users:", error);
    });
}

// Function to update user's credit limit
function updateUserCreditLimit(userDocPath, userData) {
    const newCreditLimit = document.getElementById('newCreditLimit').value.trim();  // Get the new credit limit

    if (!newCreditLimit) {
        alert("Please enter a valid credit limit.");
        return;
    }

    const userRef = `${userUrl}${userDocPath.split('/').pop()}`; // Correctly format the user document path

    fetch(userRef, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fields: {
                ...userData, // Spread existing user data
                creditLimit: { integerValue: parseInt(newCreditLimit) } // Update only the credit limit
            }
        })
    })
    .then(response => {
        if (response.ok) {
            alert("Credit limit updated successfully!");
            document.getElementById('updateCreditForm').reset(); // Reset the form
            document.getElementById('currentCreditLimit').textContent = '';
        } else {
            alert("Error updating credit limit: " + response.statusText);
        }
    })
    .catch(error => {
        console.error("Error updating credit limit:", error);
    });
}


// Generate reports
function generateTopCustomersReport() {
    fetch(`${baseUrl}orders`) // Replace with the correct path to your orders collection
    .then(response => response.json())
    .then(data => {
        let reportData = [];
        if (data.documents) {
            const customerMap = {};
            data.documents.forEach(doc => {
                const order = doc.fields;
                const user = order.userId.stringValue; // Adjust the field name if necessary
                const total = order.totalAmount.integerValue; // Adjust the field name if necessary
                customerMap[user] = (customerMap[user] || 0) + total;
            });

            const topCustomers = Object.entries(customerMap)
                .sort((a, b) => b[1] - a[1]) // Sort by total amount spent, descending
                .slice(0, 10); // Get top 10 customers

            reportData.push(['Customer Name', 'Total Amount']); // Add header
            topCustomers.forEach(customer => {
                reportData.push([customer[0], customer[1]]);
            });
            exportCSV(reportData, "Top_Customers_Report");
        }
    })
    .catch(error => {
        console.error("Error generating top customers report:", error);
    });
}

function generateCashCustomersReport() {
    fetch(`${baseUrl}orders`) // Replace with the correct path to your orders collection
    .then(response => response.json())
    .then(data => {
        let reportData = [];
        if (data.documents) {
            const cashCustomerMap = {};
            data.documents.forEach(doc => {
                const order = doc.fields;
                if (order.paymentType.stringValue === "cash on Delivery") {
                    const user = order.userId.stringValue; // Adjust the field name if necessary
                    const total = order.totalAmount.integerValue; // Adjust the field name if necessary
                    cashCustomerMap[user] = (cashCustomerMap[user] || 0) + total;
                }
            });

            const topCashCustomers = Object.entries(cashCustomerMap)
                .sort((a, b) => b[1] - a[1]) // Sort by total amount spent, descending
                .slice(0, 10); // Get top 10 cash customers

            reportData.push(['Customer Name', 'Total Amount']); // Add header
            topCashCustomers.forEach(customer => {
                reportData.push([customer[0], customer[1]]);
            });
            exportCSV(reportData, "Top_Cash_Customers_Report");
        }
    })
    .catch(error => {
        console.error("Error generating cash customers report:", error);
    });
}

function generateCreditCardCustomersReport() {
    fetch(`${baseUrl}orders`) // Replace with the correct path to your orders collection
    .then(response => response.json())
    .then(data => {
        let reportData = [];
        if (data.documents) {
            const creditCardCustomerMap = {};
            data.documents.forEach(doc => {
                const order = doc.fields;
                if (order.payment_type.stringValue === "Credit Card") {
                    const user = order.userId.stringValue; // Adjust the field name if necessary
                    const total = order.totalAmount.integerValue; // Adjust the field name if necessary
                    creditCardCustomerMap[user] = (creditCardCustomerMap[user] || 0) + total;
                }
            });

            const topCreditCardCustomers = Object.entries(creditCardCustomerMap)
                .sort((a, b) => b[1] - a[1]) // Sort by total amount spent, descending
                .slice(0, 10); // Get top 10 credit card customers

            reportData.push(['Customer Name', 'Total Amount']); // Add header
            topCreditCardCustomers.forEach(customer => {
                reportData.push([customer[0], customer[1]]);
            });
            exportCSV(reportData, "Top_Credit_Card_Customers_Report");
        }
    })
    .catch(error => {
        console.error("Error generating credit card customers report:", error);
    });
}

function generateSalesReport() {
    fetch(`${baseUrl}orders`)
    .then(response => response.json())
    .then(data => {
        let reportData = [];
        if (data.documents) {
            reportData.push(['User Name', 'Item ID', 'Total Amount', 'Purchase Date']); // Add header
            data.documents.forEach(doc => {
                const sale = doc.fields;
                reportData.push([
                    sale.userId ? sale.userId.stringValue : 'Unknown User',
                    sale.id ? sale.id.stringValue : 'Unknown Item',
                    sale.totalAmount ? sale.totalAmount.integerValue : 0,
                    sale.orderDate ? sale.orderDate.stringValue : 'Unknown Date'
                ]);
            });
            exportCSV(reportData, "Sales_Report");
        }
    })
    .catch(error => {
        console.error("Error generating sales report:", error);
    });
}

function generateCategoryWiseSalesReport() {
    fetch(`${baseUrl}orders`)
    .then(response => response.json())
    .then(data => {
        let reportData = {};
        if (data.documents) {
            data.documents.forEach(doc => {
                const sale = doc.fields;
                const category = sale.id ? sale.id.stringValue : 'Unknown Category';
                const amount = sale.totalAmount ? sale.totalAmount.integerValue : 0;

                if (!reportData[category]) {
                    reportData[category] = 0;
                }
                reportData[category] += amount;
            });

            const reportArray = [['Category', 'Total Sales']]; // Add header
            Object.entries(reportData).forEach(([category, total]) => {
                reportArray.push([category, total]);
            });
            exportCSV(reportArray, "Category_Wise_Sales_Report");
        }
    })
    .catch(error => {
        console.error("Error generating category wise sales report:", error);
    });
}

function generateTopSellingItemsReport() {
    fetch(`${baseUrl}orders`)
    .then(response => response.json())
    .then(data => {
        let reportData = {};
        if (data.documents) {
            data.documents.forEach(doc => {
                const sale = doc.fields;
                const item = sale.id ? sale.id.stringValue : 'Unknown Item';
                const quantity = sale.quantity ? sale.quantity.integerValue : 0;

                reportData[item] = (reportData[item] || 0) + quantity;
            });

            const topSellingItems = Object.entries(reportData)
                .sort((a, b) => b[1] - a[1]) // Sort by quantity sold, descending
                .slice(0, 10); // Get top 10 selling items

            const reportArray = [['Item ID', 'Total Sold']]; // Add header
            topSellingItems.forEach(item => {
                reportArray.push([item[0], item[1]]);
            });
            exportCSV(reportArray, "Top_Selling_Items_Report");
        }
    })
    .catch(error => {
        console.error("Error generating top selling items report:", error);
    });
}


function generateInventoryReport() {
    fetch(`${baseUrl}products`) // Replace with the correct path to your products collection
    .then(response => response.json())
    .then(data => {
        let reportData = [];
        if (data.documents) {
            reportData.push(['Product Title', 'Quantity', 'Price']); // Add header
            data.documents.forEach(doc => {
                const product = doc.fields;
                reportData.push([
                    product.title.stringValue,
                    product.quantity.integerValue,
                    product.price.doubleValue
                ]);
            });
            exportCSV(reportData, "Inventory_Report");
        }
    })
    .catch(error => {
        console.error("Error generating inventory report:", error);
    });
}

// Export data as CSV
function exportCSV(data, filename) {
    let csvContent = "data:text/csv;charset=utf-8," + data.map(e => e.join(",")).join("\n");
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename + ".csv");
    document.body.appendChild(link);
    link.click();
}
