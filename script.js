/* =================================
   THRIFT VILLAGE - JAVASCRIPT
================================= */

// PRODUCT DATA

const products = [
    {
        id: 1,
        name: "Classic Black T-Shirt",
        price: 699,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 2,
        name: "Casual Men's Shirt",
        price: 999,
        image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 3,
        name: "Denim Jeans",
        price: 1299,
        image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 4,
        name: "Premium Hoodie",
        price: 1499,
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=80"
    }
];


// CART

let cart = [];

// WISHLIST

let wishlist = JSON.parse(
    localStorage.getItem("thriftWishlist")
) || [];

// TOGGLE WISHLIST

function toggleWishlist(productId) {

    const existingIndex = wishlist.findIndex(
        item => String(item.id) === String(productId)
    );

    if (existingIndex !== -1) {
        wishlist.splice(existingIndex, 1);
        alert("Product removed from Wishlist!");
    } else {
        const product = products.find(
            item => String(item.id) === String(productId)
        );

        if (!product) return;

        wishlist.push(product);
        alert("Product added to Wishlist! ❤️");
    }

    localStorage.setItem(
        "thriftWishlist",
        JSON.stringify(wishlist)
    );

    updateWishlistCount();
    renderWishlist();
}


// UPDATE WISHLIST COUNT

function updateWishlistCount() {

    document.getElementById("wishlistCount").textContent =
        wishlist.length;
}


// RENDER WISHLIST PRODUCTS

function renderWishlist() {

    const container = document.getElementById("wishlistItems");

    if (!container) return;

    if (wishlist.length === 0) {
        container.innerHTML = "<p>Your wishlist is empty. ❤️</p>";
        return;
    }

    container.innerHTML = wishlist.map(product => `
        <article class="product">

            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>

            <div class="product-info">
                <h3>${product.name}</h3>

                <p class="price">${money(product.price)}</p>

                <button onclick="addToCart(${product.id})">
                    ADD TO CART
                </button>

                <button onclick="toggleWishlist(${product.id})">
                    REMOVE ❤️
                </button>
            </div>

        </article>
    `).join("");
}


// DEMO CUSTOMER DATA
// Currently saved in this browser only.

let customers = [];
// LOAD CUSTOMERS FROM SUPABASE

async function loadCustomers() {

    const { data, error } = await supabaseClient
        .from("customers")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        console.error("Customer Load Error:", error.message);
        return;
    }

    customers = data.map(customer => ({
        id: customer.id,
        name: customer.full_name,
        phone: customer.phone,
        bill: Number(customer.total_purchase),
        paid: Number(customer.total_paid)
    }));

    renderCustomers();

    console.log("Customers Loaded Successfully!");
}
// LOAD ORDERS FROM SUPABASE

async function loadOrders() {

    const table = document.getElementById("ordersTable");
    const message = document.getElementById("orderMessage");

    message.textContent = "Loading orders...";

    const { data, error } = await supabaseClient
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Orders Loading Error:", error.message);
        message.textContent = "Orders loading failed!";
        return;
    }
// UPDATE ORDER ANALYTICS

document.getElementById("totalOrders").textContent = data.length;

const paidRevenue = data
    .filter(order => order.payment_status === "Paid")
    .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

const pendingPayments = data
    .filter(order => order.payment_status !== "Paid")
    .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

const deliveredCount = data
    .filter(order => order.order_status === "Delivered")
    .length;

document.getElementById("totalRevenue").textContent = money(paidRevenue);

document.getElementById("pendingOrderPayments").textContent = money(pendingPayments);

document.getElementById("deliveredOrders").textContent = deliveredCount;
    if (data.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7">No orders found.</td>
            </tr>
        `;
        message.textContent = "No new orders.";
        return;
    }

    message.textContent = "Total Orders: " + data.length;

   table.innerHTML = data.map(order => `
    <tr>
        <td>#${order.id}</td>

        <td>
            ${escapeHTML(order.customer_name)}<br>
            ${escapeHTML(order.phone)}
        </td>

        <td>
            ${(order.items || []).map(item =>
                `${escapeHTML(item.name)} (Qty: ${item.quantity || 1}) - ${money(item.price)}`
            ).join("<br>")}
        </td>

        <td>${money(order.total_amount)}</td>

        <td>
            <strong>Payment:</strong> ${escapeHTML(order.payment_status || "Pending")}<br>
            <strong>Method:</strong> ${escapeHTML(order.payment_method || "COD")}<br>
            <strong>UTR:</strong> ${escapeHTML(order.transaction_id || "Not provided")}<br>

            <button onclick="updatePaymentStatus(${order.id}, 'Paid')">
                MARK AS PAID
            </button>

            <button onclick="updatePaymentStatus(${order.id}, 'Pending')">
                MARK AS PENDING
            </button>
        </td>

        <td>
            <select onchange="updateOrderStatus(${order.id}, this.value)">
                <option value="Pending" ${order.order_status === "Pending" ? "selected" : ""}>Pending</option>
                <option value="Processing" ${order.order_status === "Processing" ? "selected" : ""}>Processing</option>
                <option value="Shipped" ${order.order_status === "Shipped" ? "selected" : ""}>Shipped</option>
                <option value="Delivered" ${order.order_status === "Delivered" ? "selected" : ""}>Delivered</option>
            </select>
        </td>

        <td>Update Status</td>
    </tr>
`).join("");
        }
// UPDATE ORDER STATUS

async function updateOrderStatus(orderId, newStatus) {

    const { error } = await supabaseClient
        .from("orders")
        .update({ order_status: newStatus })
        .eq("id", orderId);

    if (error) {
        alert("Status Update Failed: " + error.message);
        console.error(error);
        return;
    }

    alert("Order Status Updated Successfully!");
    loadOrders();
}
// MONEY FORMAT

function money(amount) {
    return "₹" + Number(amount).toLocaleString("en-IN");
}


// SAFE TEXT DISPLAY

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}


// PAGE NAVIGATION

function showPage(page) {

    document.getElementById("shopPage")
        .classList.toggle("hidden", page !== "shop");

    document.getElementById("cartPage")
        .classList.toggle("hidden", page !== "cart");

document.getElementById("wishlistPage")
    .classList.toggle("hidden", page !== "wishlist");

    document.getElementById("customerAuth")
        .classList.toggle("hidden", page !== "customerAuth");

    document.getElementById("adminPage")
        .classList.toggle("hidden", page !== "admin");

    if (page === "cart") {
        renderCart();
        updateCheckoutVisibility();
    }
if (page === "customerAuth") {
    loadCustomerOrders();
}
    if (page === "admin") {
        renderCustomers();
        loadOrders();
        loadPaymentSettings();
    }

    window.scrollTo(0, 0);
}
// LOAD PRODUCTS FROM SUPABASE

async function loadProducts() {

    const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        console.error("Products Loading Error:", error.message);
        return;
    }
console.log("Products Data:", data);
    products.length = 0;

    data.forEach(product => {
        products.push({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.image_url,
            description: product.description,
            category: product.category,
            size: product.size,
            color: product.color
        });
    });
loadProductCategories();
    renderProducts();
    renderManageProducts();
}

// DISPLAY PRODUCTS
// DISPLAY PRODUCTS WITH SEARCH AND CATEGORY FILTER

function renderProducts() {

    const searchInput = document.getElementById("productSearch");
    const categoryFilter = document.getElementById("categoryFilter");

    const searchText = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";

    const selectedCategory = categoryFilter
        ? categoryFilter.value
        : "all";

    const filteredProducts = products.filter(product => {

        const matchesSearch =
            (product.name || "").toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "all" ||
            (product.category || "").toLowerCase() === selectedCategory;

        return matchesSearch && matchesCategory;
    });
// PRODUCT SORTING

const sortOption = document.getElementById("sortProducts");

if (sortOption) {

    if (sortOption.value === "low") {
        filteredProducts.sort((a, b) => a.price - b.price);
    }

    else if (sortOption.value === "high") {
        filteredProducts.sort((a, b) => b.price - a.price);
    }

    else if (sortOption.value === "latest") {
        filteredProducts.sort((a, b) => Number(b.id) - Number(a.id));
    }
}
    const container = document.getElementById("products");

    if (filteredProducts.length === 0) {
        container.innerHTML = "<p>No products found.</p>";
        return;
    }

    container.innerHTML = filteredProducts.map(product => `

      <article class="product" onclick="showProductDetails(${product.id})">

            <div class="product-image">
                <img
                    src="${product.image}"
                    alt="${product.name}"
                    loading="lazy"
                >
            </div>

            <div class="product-info">

                <h3>${product.name}</h3>

                <p class="price">
                    ${money(product.price)}
                </p>

              <button onclick="event.stopPropagation(); addToCart(${product.id})">
                    ADD TO CART
                </button>

<button onclick="event.stopPropagation(); toggleWishlist(${product.id})">
    ❤️ ADD TO WISHLIST
</button>

            </div>

        </article>

    `).join("");
    
}
// SHOW PRODUCT DETAILS

function showProductDetails(id) {

    const product = products.find(
        item => String(item.id) === String(id)
    );

    if (!product) return;

    document.getElementById("modalProductImage").src =
        product.image || "";

    document.getElementById("modalProductName").textContent =
        product.name || "";

    document.getElementById("modalProductPrice").textContent =
        money(product.price);

    document.getElementById("modalProductDescription").textContent =
        product.description || "No description available.";

    document.getElementById("modalProductSize").textContent =
        product.size || "Not specified";

    document.getElementById("modalProductColor").textContent =
        product.color || "Not specified";

    document.getElementById("modalAddToCart").onclick = function () {
        addToCart(product.id);
        closeProductModal();
    };

    document.getElementById("productModal").style.display = "flex";
}

// CLOSE POPUP WHEN CLICKING OUTSIDE

document.getElementById("productModal").addEventListener("click", function(event) {
    if (event.target === this) {
        closeProductModal();
    }
});

// CLOSE POPUP WITH ESC KEY

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closeProductModal();
    }
});


// CLOSE PRODUCT DETAILS

function closeProductModal() {
    document.getElementById("productModal").style.display = "none";
}
// LOAD PRODUCT CATEGORIES

function loadProductCategories() {

    const categoryFilter =
        document.getElementById("categoryFilter");

    if (!categoryFilter) return;

    const categories = [
        ...new Set(
            products
                .map(product => (product.category || "").trim())
                .filter(category => category !== "")
        )
    ];

    categoryFilter.innerHTML =
        '<option value="all">All Categories</option>';

    categories.forEach(category => {

        const option = document.createElement("option");

        option.value = category.toLowerCase();
        option.textContent = category;

        categoryFilter.appendChild(option);
    });
}
// PRODUCT SEARCH EVENTS

document.getElementById("productSearch")
    .addEventListener("input", renderProducts);

document.getElementById("categoryFilter")
    .addEventListener("change", renderProducts);
    document.getElementById("sortProducts")
    .addEventListener("change", renderProducts);
// DISPLAY PRODUCTS IN ADMIN PANEL

function renderManageProducts() {

    const table = document.getElementById("manageProductsTable");

    if (!table) return;

    if (products.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="4">No products available.</td>
            </tr>
        `;
        return;
    }

    table.innerHTML = products.map(product => `
        <tr>
            <td>${product.name}</td>
            <td>${money(product.price)}</td>
            <td>${product.category || "-"}</td>
            <td>
                <button onclick="editProduct('${product.id}')">Edit</button>
                <button onclick="deleteProduct('${product.id}')">Delete</button>
            </td>
        </tr>
    `).join("");
}
// EDIT PRODUCT

async function editProduct(id) {

    const product = products.find(
        item => String(item.id) === String(id)
    );

    if (!product) return;

    const name = prompt("Enter Product Name:", product.name);
    if (name === null || !name.trim()) return;

    const price = prompt("Enter Product Price:", product.price);
    if (price === null || !Number.isFinite(Number(price)) || Number(price) <= 0) {
        alert("Please enter a valid price.");
        return;
    }

    const { error } = await supabaseClient
        .from("products")
        .update({
            name: name.trim(),
            price: Number(price)
        })
        .eq("id", id);

    if (error) {
        alert("Update Failed: " + error.message);
        return;
    }

    alert("Product Updated Successfully!");

    await loadProducts();
}
// DELETE PRODUCT

async function deleteProduct(id) {

    const product = products.find(
        item => String(item.id) === String(id)
    );

    if (!product) return;

    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
        return;
    }

    const { error } = await supabaseClient
        .from("products")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Delete Failed: " + error.message);
        return;
    }

    alert("Product Deleted Successfully!");

    await loadProducts();
}

// ADD TO CART WITH QUANTITY

function addToCart(id) {

    const product = products.find(
        item => item.id === id
    );

    if (!product) return;

    const existingItem = cart.find(
        item => item.id === id
    );

    if (existingItem) {

        existingItem.quantity += 1;

    } else {

        cart.push({
            ...product,
            quantity: 1
        });

    }

    document.getElementById("cartCount")
        .textContent = cart.reduce(
            (sum, item) => sum + item.quantity, 0
        );

    renderCart();

    alert(product.name + " added to cart!");
}


// DISPLAY CART

// DISPLAY CART WITH QUANTITY

function renderCart() {

    const container =
        document.getElementById("cartItems");

    if (cart.length === 0) {

        container.textContent = "Your cart is empty.";

    } else {

        container.innerHTML = cart.map((item, index) => `

            <div style="padding:10px; border-bottom:1px solid #ddd;">

                <p>
                    <strong>${item.name}</strong>
                </p>

                <p>
                    Price: ${money(item.price)}
                </p>

                <button onclick="changeQuantity(${index}, -1)">
                    −
                </button>

                <strong style="margin:0 12px;">
                    ${item.quantity}
                </strong>

                <button onclick="changeQuantity(${index}, 1)">
                    +
                </button>

                <p>
                    Subtotal: ${money(item.price * item.quantity)}
                </p>

                <button onclick="removeFromCart(${index})">
                    Remove
                </button>

            </div>

        `).join("");

    }

    const total = cart.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
    );

    document.getElementById("cartTotal")
        .textContent = "Total: " + money(total);

    document.getElementById("cartCount")
        .textContent = cart.reduce(
            (sum, item) => sum + item.quantity, 0
        );
}
// CHANGE PRODUCT QUANTITY

function changeQuantity(index, change) {

    cart[index].quantity += change;

    if (cart[index].quantity <= 0) {

        cart.splice(index, 1);

    }

    renderCart();
}
// REMOVE FROM CART

function removeFromCart(index) {

    cart.splice(index, 1);

    document.getElementById("cartCount")
        .textContent = cart.length;

    renderCart();
}


// ONLINE CHECKOUT - SAVE ORDER IN SUPABASE

document.getElementById("checkoutForm")
.addEventListener("submit", async function(event) {

    event.preventDefault();
const { data: { session } } = await supabaseClient.auth.getSession();

if (!session) {
    alert("Please login before placing your order.");
    return;
}
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const name = document.getElementById("buyerName").value.trim();
    const phone = document.getElementById("buyerPhone").value.trim();
    const address = document.getElementById("buyerAddress").value.trim();
    const delivery = document.getElementById("deliveryOption").value;
    const paymentMethod = document.getElementById("paymentMethod").value;
    const transactionId = document.getElementById("transactionId").value.trim();

   // CALCULATE TOTAL WITH QUANTITY

const total = cart.reduce(
    (sum, item) =>
        sum + (Number(item.price) * item.quantity), 0
);

// SAVE ORDER PRODUCTS WITH QUANTITY

const orderItems = cart.map(item => ({
    id: item.id,
    name: item.name,
    price: Number(item.price),
    quantity: item.quantity,
    subtotal: Number(item.price) * item.quantity
}));

    const submitButton = this.querySelector(
        'button[type="submit"]'
    );

    submitButton.disabled = true;
    submitButton.textContent = "Placing Order...";
// INITIAL PAYMENT STATUS

const initialPaymentStatus = "Pending";
   const trackingToken = crypto.randomUUID();

     const { error } = await supabaseClient
    .from("orders")
    .insert({
        user_id: session.user.id,
        customer_name: name,
        phone: phone,
        address: address,
        delivery_type: delivery,
        items: orderItems,
        total_amount: total,
        payment_status: initialPaymentStatus,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        order_status: "Pending",
        tracking_token: trackingToken
    });

    submitButton.disabled = false;
    submitButton.textContent = "PLACE  ORDER";

    if (error) {
        console.error("Order Error:", error.message);
        alert("Order Failed: " + error.message);
        return;
    }

    const trackingLink = new URL(
    "tracking.html",
    window.location.href
);

trackingLink.searchParams.set("token", trackingToken);

const trackingBox = document.createElement("div");

trackingBox.style.padding = "15px";
trackingBox.style.margin = "15px 0";
trackingBox.style.background = "#e8f5e9";
trackingBox.style.borderRadius = "10px";


trackingBox.innerHTML = `
    <div style="text-align:center; padding:20px;">

        <h2 style="color:#16a34a;">
            Order Confirmed! ❤️
        </h2>

        <p>Thank you for shopping with Thrift Village.</p>

        <p style="font-size:14px; color:red;">
            Your order has been successfully placed.
        </p>

        <button id="openTrackingBtn" class="primary-btn">
            TRACK YOUR ORDER
        </button>

        <button id="sendWhatsAppBtn"
            class="primary-btn"
            style="background:#25D366; margin-top:12px;">
            SEND WHATSAPP CONFIRMATION
        </button>
      <button id="downloadInvoiceBtn"
    class="primary-btn"
    style="background:#D4AF37; color:#171717; border:1px solid #B8962E; margin-top:12px; padding:8px 18px; font-size:14px;">
    DOWNLOAD INVOICE (PDF)
</button>

        <p style="font-size:12px; margin-top:12px;">
            INVOIC DOWNLOAD
        </p>

    </div>
`;

document.getElementById("checkoutForm")
    .after(trackingBox);

document.getElementById("openTrackingBtn")
    .addEventListener("click", function() {
        window.open(trackingLink.href, "_blank");
    });
// SEND WHATSAPP ORDER CONFIRMATION

document.getElementById("sendWhatsAppBtn")
    .addEventListener("click", function() {

        const message = `
THRIFT VILLAGE
================================

Hello ${name},

Thank you for shopping with Thrift Village!

Your order has been successfully confirmed.

ORDER DETAILS
--------------------------------

Order ID: #${trackingToken.slice(0, 8)}

PRODUCTS ORDERED
--------------------------------

${orderItems.map((item, index) =>
    `${index + 1}. ${item.name} | Qty: ${item.quantity} | Price: INR ${item.price} | Subtotal: INR ${item.subtotal}`
).join("\n")}

--------------------------------

Total Amount: INR ${total}
Payment Method: ${paymentMethod}
Payment Status: ${initialPaymentStatus}
Delivery: ${delivery}

--------------------------------

TRACK YOUR ORDER

${trackingLink.href}

================================

Thank you for choosing Thrift Village.

YOUR STYLE, OUR PRIORITY.

Team Thrift Village
`;

        const whatsappURL =
            "https://wa.me/91" + phone +
            "?text=" + encodeURIComponent(message);

        window.open(whatsappURL, "_blank");

    });
// DOWNLOAD ORDER INVOICE PDF

document.getElementById("downloadInvoiceBtn")
    .addEventListener("click", async function() {

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
// ADD THRIFT VILLAGE LOGO

// Logo temporarily skipped

       // PREMIUM INVOICE HEADER

doc.setFillColor(25, 25, 25);
doc.rect(0, 0, 210, 42, "F");
// LOAD THRIFT VILLAGE LOGO
try {
    const logo = new Image();
    logo.src = "thrift-village-logo.png";

    await new Promise((resolve, reject) => {
        logo.onload = resolve;
        logo.onerror = reject;
    });

    const canvas = document.createElement("canvas");
    canvas.width = logo.naturalWidth;
    canvas.height = logo.naturalHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(logo, 0, 0);

    const logoData = canvas.toDataURL("image/png");

    doc.addImage(logoData, "PNG", 160, 5, 32, 32);
} catch (error) {
    console.error("Logo could not be loaded:", error);
}
doc.setTextColor(212, 175, 55);
doc.setFontSize(24);
doc.setFont("helvetica", "bold");
doc.text("THRIFT VILLAGE", 20, 20);

doc.setTextColor(255, 255, 255);
doc.setFontSize(11);
doc.setFont("helvetica", "normal");
doc.text("YOUR STYLE, OUR PRIORITY", 20, 30);

doc.setTextColor(0, 0, 0);

        doc.setFontSize(12);
      doc.text("ORDER INVOICE", 20, 40);

        doc.text(`Customer Name: ${name}`, 20, 45);
        doc.text(`Phone: ${phone}`, 20, 55);
        doc.text(`Address: ${address}`, 20, 65);

        doc.text(
            `Order ID: ${trackingToken.slice(0, 8)}`,
            20, 80
        );
         const orderDate = new Date().toLocaleDateString("en-IN");

doc.text(`Order Date: ${orderDate}`, 20, 90);
        doc.text("PRODUCTS:", 20, 105);
        doc.setDrawColor(212, 175, 55);
doc.setLineWidth(0.8);
doc.line(20, 110, 190, 110);

doc.setFont("helvetica", "bold");
doc.setFontSize(11);

        let y = 115;

        orderItems.forEach((item, index) => {

    doc.text(
        `${index + 1}. ${item.name}`,
        20, y
    );

    doc.text(
        `Qty: ${item.quantity}  |  Price: INR ${item.price}  |  Subtotal: INR ${item.subtotal}`,
        20, y + 6
    );

    y += 15;

});
        y += 5;

       doc.setFillColor(245, 235, 210);
doc.roundedRect(15, y - 7, 180, 15, 3, 3, "F");

doc.setTextColor(120, 85, 20);
doc.setFont("helvetica", "bold");
doc.setFontSize(14);

doc.text(`TOTAL AMOUNT: INR ${total}`, 20, y + 3);

doc.setTextColor(0, 0, 0);
        doc.text(`Payment Method: ${paymentMethod}`, 20, y + 10);
        doc.text(`Payment Status: ${initialPaymentStatus}`, 20, y + 20);
        doc.text(`Delivery: ${delivery}`, 20, y + 30);
        // PREMIUM INVOICE FOOTER

doc.setDrawColor(212, 175, 55);
doc.line(20, 270, 190, 270);

doc.setFontSize(11);
doc.setFont("helvetica", "bold");
doc.setTextColor(120, 85, 20);

doc.text("THANK YOU FOR SHOPPING WITH US!", 105, 280, {
    align: "center"
});

doc.setFontSize(9);
doc.setFont("helvetica", "normal");
doc.setTextColor(100, 100, 100);

doc.text("THRIFT VILLAGE - YOUR STYLE, OUR PRIORITY", 105, 287, {
    align: "center"
});
        doc.save(`Thrift-Village-Invoice-${trackingToken.slice(0, 8)}.pdf`);

    });
alert(
    "Order Placed Successfully! ❤️\n\n" +
    "Your Order Tracking Link:\n" +
    trackingLink.href
);

cart = [];

document.getElementById("cartCount").textContent = "0";

this.reset();

renderCart();

});

// ADD CUSTOMER BILL

// ADD CUSTOMER BILL TO SUPABASE

document.getElementById("customerForm")
.addEventListener("submit", async function(event) {

    event.preventDefault();

    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();

    const bill = Number(document.getElementById("billAmount").value);
    const paid = Number(document.getElementById("paidAmount").value);

    if (!Number.isFinite(bill) || !Number.isFinite(paid) ||
        bill <= 0 || paid < 0 || paid > bill) {

        alert("Please enter valid bill and payment amounts.");
        return;
    }

    const pending = bill - paid;

    const { data, error } = await supabaseClient
        .from("customers")
        .insert([{
            full_name: name,
            phone: phone,
            total_purchase: bill,
            total_paid: paid,
            total_pending: pending
        }])
        .select();

    if (error) {
        console.error("Save Error:", error.message);
        alert("Customer save failed: " + error.message);
        return;
    }

    this.reset();

    document.getElementById("paidAmount").value = "0";

    await loadCustomers();

    alert("Customer bill saved successfully in Supabase!");

});
// DISPLAY CUSTOMER ACCOUNTS

function renderCustomers() {

    const totalBill = customers.reduce(
        (sum, customer) => sum + customer.bill, 0
    );

    const totalPaid = customers.reduce(
        (sum, customer) => sum + customer.paid, 0
    );

    const totalPending = totalBill - totalPaid;

    document.getElementById("totalBills")
        .textContent = money(totalBill);

    document.getElementById("totalPaid")
        .textContent = money(totalPaid);

    document.getElementById("totalPending")
        .textContent = money(totalPending);


    document.getElementById("customerTable").innerHTML =

        customers.map(customer => {

            const pending =
                customer.bill - customer.paid;

            return `

                <tr>

                    <td>
                        ${escapeHTML(customer.name)}
                        <br>
                        ${escapeHTML(customer.phone)}
                    </td>

                    <td>${money(customer.bill)}</td>

                    <td>${money(customer.paid)}</td>

                    <td>${money(pending)}</td>

                    <td>

                        ${pending > 0 ? `

                            <button class="payment-btn"
                                onclick="addPayment(${customer.id})">
                                Add Payment
                            </button>

                            <button class="whatsapp"
                                onclick="sendReminder(${customer.id})">
                                WhatsApp
                            </button>

                        ` : "PAID ✓"}

                    </td>

                </tr>

            `;

        }).join("");

}


// ADD CUSTOMER PAYMENT

function addPayment(id) {

    const customer = customers.find(
        item => item.id === id
    );

    if (!customer) return;

    const pending = customer.bill - customer.paid;

    const input = prompt(
        "Pending Amount: " + money(pending) +
        "\nEnter payment received:"
    );

    if (input === null || input.trim() === "") return;

    const amount = Number(input);

    if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > pending
    ) {

        alert("Please enter a valid payment amount.");
        return;

    }

    customer.paid += amount;

    saveCustomers();

    renderCustomers();

    alert("Payment updated successfully!");

}


// WHATSAPP REMINDER

function sendReminder(id) {

    const customer = customers.find(
        item => item.id === id
    );

    if (!customer) return;

    const pending = customer.bill - customer.paid;

    if (pending <= 0) {

        alert("Customer has no pending amount.");
        return;

    }

    const phone = customer.phone.replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(phone)) {

        alert("Please enter a valid Indian mobile number.");
        return;

    }

    const message =

        "Hello " + customer.name + "! 👋\n\n" +

        "Thank you for shopping at Thrift Village.\n\n" +

        "Total Bill: " + money(customer.bill) + "\n" +

        "Amount Paid: " + money(customer.paid) + "\n" +

        "Pending Amount: " + money(pending) + "\n\n" +

        "Kindly clear your pending balance at your convenience.\n\n" +

        "Thank you for shopping with us! ❤️\n" +

        "THRIFT VILLAGE";

    const url =
        "https://wa.me/91" + phone +
        "?text=" + encodeURIComponent(message);

    window.open(url, "_blank");

}


// INITIALIZE Website

loadCustomers();
loadProducts();

console.log("Thrift Village Website Loaded Successfully!");
// ADMIN LOGIN560
const adminLoginForm = document.getElementById("adminLoginForm");

if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const email = document.getElementById("adminEmail").value;
        const password = document.getElementById("adminPassword").value;
        const message = document.getElementById("adminLoginMessage");

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            message.textContent = "Login Failed: " + error.message;
            return;
        }
if (data.user.id !== "7bec2863-877f-42d1-83dc-0ade4373d8bc") {
    await supabaseClient.auth.signOut();
    message.textContent = "Access Denied: Admin Only!";
    return;
}
        message.textContent = "Admin Login Successful!";

        console.log("Admin Logged In:", data.user.email);
        document.getElementById("adminLoginSection").style.display = "none";
        document.getElementById("adminDashboard").style.display = "block";
    });
}

supabaseClient.auth.getSession().then(({ data, error }) => {
    console.log("Session:", data.session ? "ACTIVE" : "NOT ACTIVE");
    console.log("Recovery:", data.session?.user ? "USER SESSION FOUND" : "NO USER");
});
// CHECK PASSWORD RECOVERY SESSION
// CHECK PASSWORD RECOVERY
supabaseClient.auth.onAuthStateChange((event, session) => {

    if (event === "PASSWORD_RECOVERY" && session) {

        document.getElementById("adminLoginSection").style.display = "none";

        document.getElementById("passwordResetSection").style.display = "block";

        console.log("Password Recovery Session Active!");
    }

});
// ADMIN PASSWORD RESET
const passwordResetForm = document.getElementById("passwordResetForm");

if (passwordResetForm) {
    passwordResetForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const newPassword = document.getElementById("newAdminPassword").value;
        const message = document.getElementById("passwordResetMessage");

        const { data, error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });

        if (error) {
            message.textContent = "Password Update Failed: " + error.message;
            return;
        }

        message.textContent = "Password Updated Successfully!";
        passwordResetForm.reset();
    });
}
// ADMIN LOGOUT

async function adminLogout() {

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert("Logout Failed: " + error.message);
        return;
    }

    document.getElementById("adminDashboard").style.display = "none";

    document.getElementById("adminLoginSection").style.display = "block";

    document.getElementById("adminLoginMessage").textContent = "";

    alert("Admin Logged Out Successfully!");
}
// ADD NEW PRODUCT TO SUPABASE

const productForm = document.getElementById("productForm");

if (productForm) {
    productForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const name = document.getElementById("productName").value.trim();
        const description = document.getElementById("productDescription").value.trim();
        const price = Number(document.getElementById("productPrice").value);
        const image_url = document.getElementById("productImageUrl").value.trim();
        const category = document.getElementById("productCategory").value.trim();
        const size = document.getElementById("productSize").value.trim();
        const color = document.getElementById("productColor").value.trim();
        const message = document.getElementById("productMessage");

        
        message.textContent = "Saving product...";

const { data: { session }, error: sessionError } =
    await supabaseClient.auth.getSession();

console.log("Session Check:", {
    userId: session?.user?.id,
    tokenPresent: !!session?.access_token,
    error: sessionError
});

if (session?.access_token) {
    const payload = JSON.parse(
        atob(session.access_token.split(".")[1])
    );

    console.log("JWT Role:", payload.role);
}

console.log("Current Admin ID:", session?.user?.id);

        const { data, error } = await supabaseClient
            .from("products")
            .insert([{
                name,
                description,
                price,
                image_url,
                category,
                size,
                color
            }])
            .select()
            .single();

        if (error) {
            console.log("FULL INSERT ERROR:", error);
console.log("ERROR CODE:", error.code);
console.log("ERROR DETAILS:", error.details);
console.log("ERROR HINT:", error.hint);
            message.textContent = "Error: " + error.message;
            return;
        }

        products.unshift({
            id: data.id,
            name: data.name,
            price: Number(data.price),
            image: data.image_url
        });

        renderProducts();
        productForm.reset();
        message.textContent = "Product Added Successfully!";
    });
}
// LOAD UPI PAYMENT SETTINGS
async function loadPaymentSettings() {

    const { data, error } = await supabaseClient
        .from("payment_settings")
        .select("*")
        .eq("id", 1)
        .single();

    if (error) {
        console.error("Payment Settings Error:", error.message);
        return;
    }

    document.getElementById("adminUpiId").value = data.upi_id || "";

    const preview = document.getElementById("currentQrPreview");
    console.log("Saved QR URL:", data.qr_code_url);

    if (data.qr_code_url) {

    preview.innerHTML = "";

    const title = document.createElement("p");
    title.textContent = "Current QR Code:";
    preview.appendChild(title);

    const img = document.createElement("img");

    img.src = data.qr_code_url + "?t=" + Date.now();
    img.alt = "Payment QR Code";
    img.style.width = "180px";
    img.style.maxWidth = "100%";
    img.style.display = "block";
    img.style.borderRadius = "10px";

    img.onerror = function() {
        preview.innerHTML += "<p>QR image could not load!</p>";
    };

    preview.appendChild(img);
}
    }



// SAVE UPI PAYMENT SETTINGS
const upiSettingsForm = document.getElementById("upiSettingsForm");

if (upiSettingsForm) {

    upiSettingsForm.addEventListener("submit", async function(e) {

        e.preventDefault();

        const message = document.getElementById("upiSettingsMessage");
        const upiId = document.getElementById("adminUpiId").value.trim();
        const qrFile = document.getElementById("adminQrCode").files[0];

        message.textContent = "Saving settings...";

        let qrCodeUrl = null;

        const { data: oldSettings } = await supabaseClient
            .from("payment_settings")
            .select("qr_code_url")
            .eq("id", 1)
            .single();

        qrCodeUrl = oldSettings?.qr_code_url || null;

        if (qrFile) {

            const { error: uploadError } = await supabaseClient
                .storage
                .from("payment-QR")
                .upload("payment-Qr.png", qrFile,  {
                    upsert: true,
                    contentType: qrFile.type
                });

            if (uploadError) {
                message.textContent = "QR Upload Failed: " + uploadError.message;
                return;
            }

            const { data: urlData } = supabaseClient
                .storage
                .from("payment-qr")
               .getPublicUrl("payment-Qr.png");

            qrCodeUrl = urlData.publicUrl;
        }

        const { error } = await supabaseClient
            .from("payment_settings")
            .update({
                upi_id: upiId,
                qr_code_url: qrCodeUrl,
                updated_at: new Date().toISOString()
            })
            .eq("id", 1);

        if (error) {
            message.textContent = "Save Failed: " + error.message;
            return;
        }

        message.textContent = "Payment Settings Saved Successfully! ❤️";

        loadPaymentSettings();
    });

}
// LOAD UPI DETAILS FOR CUSTOMER CHECKOUT

async function loadCheckoutPaymentSettings() {

    const { data, error } = await supabaseClient
        .from("payment_settings")
        .select("upi_id, qr_code_url")
        .eq("id", 1)
        .single();

    if (error) {
        console.error("UPI Settings Error:", error.message);
        return;
    }

    document.getElementById("checkoutUpiId").textContent =
        data.upi_id || "";

    const qr = document.getElementById("checkoutQrCode");

    if (data.qr_code_url) {
        qr.src = data.qr_code_url;
        qr.style.display = "block";
    } else {
        qr.style.display = "none";
    }
}


// SHOW OR HIDE UPI PAYMENT BOX

const paymentMethod = document.getElementById("paymentMethod");
const upiPaymentBox = document.getElementById("upiPaymentBox");
const transactionId = document.getElementById("transactionId");

if (paymentMethod) {

    paymentMethod.addEventListener("change", function() {

        const isUPI = this.value === "UPI";

        upiPaymentBox.style.display = isUPI ? "block" : "none";

        transactionId.required = isUPI;

    });

    loadCheckoutPaymentSettings();

    paymentMethod.dispatchEvent(new Event("change"));
}
// UPDATE PAYMENT STATUS

async function updatePaymentStatus(orderId, newStatus) {

    if (!["Paid", "Pending"].includes(newStatus)) {
        alert("Invalid payment status!");
        return;
    }

    const confirmPayment = confirm(
        newStatus === "Paid"
            ? "Have you verified the payment in your PhonePe / UPI app?"
            : "Are you sure you want to mark this payment as Pending?"
    );

    if (!confirmPayment) return;

    const { error } = await supabaseClient
        .from("orders")
        .update({
            payment_status: newStatus
        })
        .eq("id", orderId);

    if (error) {
        console.error("Payment Update Error:", error);
        alert("Payment Update Failed: " + error.message);
        return;
    }

    alert("Payment Status Updated to " + newStatus + " ❤️");

    await loadOrders();
}
// SHOW ADMIN BUTTON ONLY FOR ADMIN
const ADMIN_USER_ID = "7bec2863-877f-42d1-83dc-0ade4373d8bc";

const adminNavButton = document.getElementById("adminNavButton");

supabaseClient.auth.getSession().then(({ data }) => {
    if (adminNavButton) {
        adminNavButton.style.display =
            data.session?.user?.id === ADMIN_USER_ID
                ? "inline-block"
                : "none";
    }
});

supabaseClient.auth.onAuthStateChange((event, session) => {
    if (adminNavButton) {
        adminNavButton.style.display =
            session?.user?.id === ADMIN_USER_ID
                ? "inline-block"
                : "none";
    }
});
// CUSTOMER LOGIN / SIGNUP PAGE TOGGLE

function showCustomerLogin() {
    document.getElementById("customerLoginForm").style.display = "block";
    document.getElementById("customerSignupForm").style.display = "none";
}

function showCustomerSignup() {
    document.getElementById("customerLoginForm").style.display = "none";
    document.getElementById("customerSignupForm").style.display = "block";
}
// CUSTOMER SIGNUP
document.getElementById("customerSignupForm")
.addEventListener("submit", async function(e) {
    e.preventDefault();

    const name = document.getElementById("customerSignupName").value.trim();
    const email = document.getElementById("customerSignupEmail").value.trim();
    const password = document.getElementById("customerSignupPassword").value;
    const message = document.getElementById("customerSignupMessage");

    message.textContent = "Creating account...";

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                full_name: name
            }
        }
    });

    if (error) {
        message.textContent = "Signup Failed: " + error.message;
        return;
    }

    message.textContent = data.session
        ? "Account created successfully! You are logged in."
        : "Account created! Please verify your email, then login.";

    this.reset();
});
// CUSTOMER LOGIN
document.getElementById("customerLoginForm")
.addEventListener("submit", async function(e) {
    e.preventDefault();

    const email = document.getElementById("customerLoginEmail").value.trim();
    const password = document.getElementById("customerLoginPassword").value;
    const message = document.getElementById("customerLoginMessage");

    message.textContent = "Logging in...";

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        message.textContent = "Login Failed: " + error.message;
        return;
    }

    message.textContent = "Login Successful! Welcome.";

    document.getElementById("customerLoginForm").reset();

    showPage("cart");
});
// CHECKOUT VISIBILITY BASED ON LOGIN
async function updateCheckoutVisibility() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    const checkoutForm = document.getElementById("checkoutForm");
    const loginNotice = document.getElementById("checkoutLoginNotice");

    if (checkoutForm && loginNotice) {
        checkoutForm.style.display = session ? "block" : "none";
        loginNotice.style.display = session ? "none" : "block";
    }
}

updateCheckoutVisibility();

supabaseClient.auth.onAuthStateChange((event, session) => {
    const checkoutForm = document.getElementById("checkoutForm");
    const loginNotice = document.getElementById("checkoutLoginNotice");

    if (checkoutForm && loginNotice) {
        checkoutForm.style.display = session ? "block" : "none";
        loginNotice.style.display = session ? "none" : "block";
    }
});
// CUSTOMER LOGOUT
async function customerLogout() {

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert("Logout Failed: " + error.message);
        return;
    }

    document.getElementById("customerAccountInfo").style.display = "none";
    document.getElementById("customerLoginForm").style.display = "block";
    document.getElementById("customerSignupForm").style.display = "none";

    document.getElementById("customerLoginMessage").textContent = "";

    showPage("shop");

    alert("Logged Out Successfully!");
}
// UPDATE CUSTOMER ACCOUNT DISPLAY

async function updateCustomerAccountUI(session) {

    const accountInfo = document.getElementById("customerAccountInfo");
    const loginForm = document.getElementById("customerLoginForm");
    const signupForm = document.getElementById("customerSignupForm");
    const welcome = document.getElementById("customerWelcome");

    if (!accountInfo || !loginForm || !signupForm) return;

    const isCustomer = session && session.user.id !== ADMIN_USER_ID;
console.log("ACCOUNT UI CHECK:", session, isCustomer);
    if (isCustomer) {
        accountInfo.style.display = "block";
        loginForm.style.display = "none";
        signupForm.style.display = "none";

        welcome.textContent =
            "Welcome, " + (session.user.user_metadata?.full_name || session.user.email);
    } else {
        accountInfo.style.display = "none";
        loginForm.style.display = "block";
    }
}

// CHECK EXISTING LOGIN
supabaseClient.auth.getSession().then(({ data }) => {
    updateCustomerAccountUI(data.session);
});

// UPDATE AFTER LOGIN OR LOGOUT
supabaseClient.auth.onAuthStateChange((event, session) => {
    updateCustomerAccountUI(session);
});
// LOAD LOGGED-IN CUSTOMER ORDERS

async function loadCustomerOrders() {

    const list = document.getElementById("customerOrdersList");

    list.textContent = "Loading your orders...";

    const { data: { user }, error: userError } =
        await supabaseClient.auth.getUser();

    if (userError || !user) {
        list.textContent = "Please login to view your orders.";
        return;
    }

    const { data, error } = await supabaseClient
        .from("orders")
        .select("id, items, total_amount, payment_status, order_status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Customer Orders Error:", error);
        list.textContent = "Unable to load orders.";
        return;
    }

    if (!data || data.length === 0) {
        list.textContent = "No orders found.";
        return;
    }

    list.innerHTML = "";

    data.forEach(order => {

        const card = document.createElement("div");
card.className = "customer-order-card";
       const stages = [
    "Pending",
    "Processing",
    "Shipped",
    "Out for Delivery",
    "Delivered"
];

const normalizeStatus = status =>
    String(status || "").toLowerCase().replace(/[_-]/g, " ").trim();

const currentStatus = normalizeStatus(order.order_status);

const currentIndex = stages.findIndex(
    stage => normalizeStatus(stage) === currentStatus
);
const statusClass = currentStatus
    .replace(/\s+/g, "-");

const displayStatus = order.order_status || "Pending";
card.innerHTML = `
    <h4>Order #${order.id}</h4>

    <p>Total: ₹${order.total_amount}</p>
    <p>Payment: ${order.payment_status}</p>
    <p>
    Order Status:
    <span class="order-status-badge status-${statusClass}">
        ${displayStatus}
    </span>
</p>
    <p>Date: ${new Date(order.created_at).toLocaleDateString()}</p>
<h4>Purchased Products</h4>

<div>
    ${(Array.isArray(order.items) ? order.items : []).map(item => `
       <div class="order-product">
            <strong>${item.name || "Product"}</strong>

            <p>Price: ₹${item.price || 0}</p>
            <p>Quantity: ${item.quantity || 1}</p>
            <p>Subtotal: ₹${item.subtotal || 0}</p>
        </div>
    `).join("")}
</div>
<button onclick="downloadOrderInvoice(${order.id})">
    Download Invoice PDF
</button>
    <h4>Order Tracking</h4>

    <div style="padding:10px 0;">

        ${stages.map((stage, index) => `
            <div style="
                display:flex;
                align-items:center;
                gap:12px;
                margin:12px 0;
                color:${index <= currentIndex ? "green" : "#999"};
            ">
                <span style="font-size:20px;">
                    ${index <= currentIndex ? "●" : "○"}
                </span>

                <strong>${stage}</strong>

                ${index === currentIndex
                    ? '<span style="font-size:12px;">(Current)</span>'
                    : ""}
            </div>
        `).join("")}

    </div>

       <hr>
`;

        list.appendChild(card);

    });

}
// DOWNLOAD CUSTOMER ORDER INVOICE

async function downloadOrderInvoice(orderId) {

    const { data: order, error } = await supabaseClient
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

    if (error || !order) {
        alert("Unable to load invoice.");
        console.error(error);
        return;
    }

    const products = Array.isArray(order.items) ? order.items : [];

    const invoiceWindow = window.open("", "_blank");

    if (!invoiceWindow) {
        alert("Please allow pop-ups to download invoice.");
        return;
    }

    invoiceWindow.document.write(`
        <html>
        <head>
            <title>Thrift Village Invoice</title>
            <style>
            * {
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    padding: 35px;
    color: #222;
    max-width: 850px;
    margin: auto;
    background: #fff;
}

.invoice-logo {
    text-align: center;
    margin-bottom: 10px;
}

.invoice-logo img {
    width: 120px;
    height: 120px;
    object-fit: contain;
    border-radius: 50%;
    border: 3px solid #d4af37;
}

h1 {
    text-align: center;
    color: #111;
    letter-spacing: 3px;
    margin-bottom: 5px;
}

h2 {
    color: #b38b2e;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 25px;
}

th {
    background: #111;
    color: #d4af37;
    padding: 13px;
}

td {
    border: 1px solid #ddd;
    padding: 12px;
}

.total {
    text-align: right;
    margin-top: 25px;
    border-top: 2px solid #d4af37;
    padding-top: 15px;
}

button {
    background: #111;
    color: #d4af37;
    border: 1px solid #d4af37;
    padding: 12px 22px;
    cursor: pointer;
    margin-top: 20px;
}

@media print {
    button {
        display: none;
    }

    body {
        padding: 15px;
    }
}
    </style>
        </head>
        <body>
           <div class="invoice-logo">
    <img src="${window.location.origin}/thrift-village-logo.png"
         alt="Thrift Village Logo">
</div>
<h1>THRIFT VILLAGE</h1>
            <h2>Order Invoice #${order.id}</h2>

           <p><strong>Customer:</strong> ${order.customer_name || ""}</p>
<p><strong>Phone:</strong> ${order.phone || ""}</p>
<p><strong>Address:</strong> ${order.address || "N/A"}</p>
<p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
<p><strong>Payment Method:</strong> ${order.payment_method || "N/A"}</p>
<p><strong>Order Status:</strong> ${order.order_status || "Pending"}</p>

            <table>
                <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Subtotal</th>
                </tr>

                ${products.map(item => `
                    <tr>
                        <td>${item.name || ""}</td>
                        <td>₹${item.price || 0}</td>
                        <td>${item.quantity || 1}</td>
                        <td>₹${item.subtotal || 0}</td>
                    </tr>
                `).join("")}
            </table>

            <div class="total">
                <h2>Total: ₹${order.total_amount}</h2>
                <p>Payment: ${order.payment_status || ""}</p>
            </div>
<div style="text-align:center; margin-top:40px; padding:20px; border-top:2px solid #d4af37;">
    <h3 style="color:#b38b2e;">THANK YOU FOR SHOPPING!</h3>
    <p>We appreciate your trust in Thrift Village.</p>
    <p><strong>YOUR STYLE. YOUR STORY.</strong></p>
</div>
            <button onclick="window.print()">Save / Download PDF</button>
        </body>
        </html>
    `);

    invoiceWindow.document.close();
}

// INITIALIZE WISHLIST

updateWishlistCount();
renderWishlist();
