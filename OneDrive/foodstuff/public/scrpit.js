// ========== MENU DATA ==========
const allMenuItems = {
    pork: [
        { id: 1, name: "Tonkotsu Ramen", desc: "Rich pork bone broth, chashu, soft egg, nori", price: 499, image: "🍜", category: "pork" },
        { id: 2, name: "Tonkotsu Black", desc: "Garlic infused black oil, pork belly", price: 549, image: "🍜", category: "pork" },
        { id: 3, name: "Spicy Tonkotsu", desc: "Spicy miso blend, ground pork, chili oil", price: 579, image: "🔥🍜", category: "pork" }
    ],
    chicken: [
        { id: 4, name: "Shoyu Ramen", desc: "Soy sauce broth, chicken, bamboo shoots", price: 449, image: "🍜", category: "chicken" },
        { id: 5, name: "Tori Paitan", desc: "Creamy chicken broth, chicken chashu", price: 499, image: "🍜", category: "chicken" },
        { id: 6, name: "Ebi Shrimp Ramen", desc: "Shrimp broth, tiger prawns, seafood", price: 649, image: "🦐🍜", category: "chicken" }
    ],
    veg: [
        { id: 7, name: "Shio Veggie Ramen", desc: "Sea salt broth, seasonal vegetables", price: 399, image: "🥬🍜", category: "veg" },
        { id: 8, name: "Miso Veggie Ramen", desc: "Savory miso, tofu, corn, mushrooms", price: 429, image: "🍜", category: "veg" },
        { id: 9, name: "Coconut Curry Ramen", desc: "Creamy coconut curry, crispy tofu", price: 459, image: "🥥🍜", category: "veg" }
    ],
    spicy: [
        { id: 10, name: "Spicy TanTan", desc: "Sesame spicy broth, ground pork, bok choy", price: 579, image: "🌶️🍜", category: "spicy" },
        { id: 11, name: "Red Dragon Ramen", desc: "Ghost pepper broth, spicy ground pork", price: 629, image: "🐉🔥🍜", category: "spicy" }
    ],
    sides: [
        { id: 12, name: "Gyoza (6pcs)", desc: "Pan-fried pork dumplings", price: 249, image: "🥟", category: "sides" },
        { id: 13, name: "Karaage Chicken", desc: "Japanese fried chicken", price: 299, image: "🍗", category: "sides" },
        { id: 14, name: "Edamame", desc: "Steamed soybeans with sea salt", price: 149, image: "🫘", category: "sides" },
        { id: 15, name: "Takoyaki", desc: "Octopus balls with sauce", price: 199, image: "🐙", category: "sides" }
    ]
};

let cart = [];
let selectedPayment = 'cod';

// Load menu on menu.html page
function loadMenuPage() {
    if (!document.getElementById('porkRamen')) return;
    
    document.getElementById('porkRamen').innerHTML = allMenuItems.pork.map(item => createMenuItemHTML(item)).join('');
    document.getElementById('chickenRamen').innerHTML = allMenuItems.chicken.map(item => createMenuItemHTML(item)).join('');
    document.getElementById('vegRamen').innerHTML = allMenuItems.veg.map(item => createMenuItemHTML(item)).join('');
    document.getElementById('spicyRamen').innerHTML = allMenuItems.spicy.map(item => createMenuItemHTML(item)).join('');
    document.getElementById('sidesMenu').innerHTML = allMenuItems.sides.map(item => createMenuItemHTML(item)).join('');
}

function createMenuItemHTML(item) {
    return `
        <div class="menu-item-card">
            <div class="menu-item-image">${item.image}</div>
            <div class="menu-item-info">
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-desc">${item.desc}</div>
                <div class="menu-item-price">₹${item.price}</div>
                <button onclick="addToCart(${item.id})">Add to Cart 🛒</button>
            </div>
        </div>
    `;
}

// Add to cart function
function addToCart(id) {
    let item = null;
    for (let category in allMenuItems) {
        item = allMenuItems[category].find(i => i.id === id);
        if (item) break;
    }
    
    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    
    updateCartUI();
    showToast(`${item.name} added to cart!`);
}

// Update cart display
function updateCartUI() {
    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
    const cartCounts = document.querySelectorAll('#cartCount, #cartCountDisplay');
    cartCounts.forEach(el => { if (el) el.innerText = totalItems; });
    
    const cartList = document.getElementById('cartItemsList');
    if (cartList) {
        if (cart.length === 0) {
            cartList.innerHTML = '<div class="empty-cart">Your cart is empty. Add items from Menu!</div>';
        } else {
            cartList.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div><strong>${item.name}</strong><br>₹${item.price} x ${item.quantity}</div>
                    <div>
                        <button onclick="updateQty(${item.id}, -1)" style="background:#ff4444; border:none; padding:5px 10px; border-radius:5px; color:white;">-</button>
                        <span style="margin:0 10px;">${item.quantity}</span>
                        <button onclick="updateQty(${item.id}, 1)" style="background:#00cc66; border:none; padding:5px 10px; border-radius:5px; color:white;">+</button>
                    </div>
                </div>
            `).join('');
        }
    }
    
    const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    const totalEl = document.getElementById('cartTotalAmount');
    if (totalEl) totalEl.innerText = `₹${total}`;
}

function updateQty(id, change) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
        updateCartUI();
    }
}

// Select payment method
function selectPayment(method) {
    selectedPayment = method;
    document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('selected');
    }
    document.getElementById('selectedPayment').value = method;
    console.log("Payment selected:", method);
}

// Place order function
async function placeOrder() {
    console.log("Place Order button clicked!");
    
    const name = document.getElementById('customerName')?.value;
    const phone = document.getElementById('customerPhone')?.value;
    const address = document.getElementById('customerAddress')?.value;
    
    if (!name || !phone || !address) {
        showToast('❌ Please fill all details!');
        return;
    }
    
    if (cart.length === 0) {
        showToast('❌ Your cart is empty! Add some ramen first.');
        return;
    }
    
    const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    const paymentMethod = document.getElementById('selectedPayment')?.value || 'cod';
    
    showToast('🔄 Placing order...');
    
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_name: name,
                customer_phone: phone,
                customer_address: address,
                items: cart,
                total_amount: total,
                payment_method: paymentMethod === 'cod' ? 'Cash on Delivery' : (paymentMethod === 'esewa' ? 'eSewa' : 'Khalti')
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(`✅ Order placed! Order #${data.orderId}`);
            cart = [];
            updateCartUI();
            document.getElementById('customerName').value = '';
            document.getElementById('customerPhone').value = '';
            document.getElementById('customerAddress').value = '';
            loadAdminOrders();
        } else {
            showToast('❌ Order failed! Try again.');
        }
    } catch (error) {
        console.error("Order error:", error);
        showToast('❌ Server error! Make sure server is running.');
    }
}

// Load admin orders
async function loadAdminOrders() {
    const container = document.getElementById('adminOrders');
    if (!container) return;
    
    try {
        const response = await fetch('/api/orders');
        const orders = await response.json();
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="loading">No orders yet</div>';
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div>
                    <strong>Order #${order.id}</strong><br>
                    👤 ${order.customer_name}<br>
                    📞 ${order.customer_phone}<br>
                    📍 ${order.customer_address}<br>
                    🍜 Items: ${JSON.parse(order.items).map(i => `${i.name} x${i.quantity}`).join(', ')}<br>
                    💰 Total: ₹${order.total_amount}<br>
                    💳 Payment: ${order.payment_method}<br>
                    Status: <span class="order-status status-${order.order_status}">${order.order_status}</span>
                </div>
                <div>
                    <button onclick="updateOrderStatus(${order.id})" style="background:#00cc66; border:none; padding:8px 15px; border-radius:5px; color:white; cursor:pointer;">✅ Complete Order</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Error loading orders:", error);
        container.innerHTML = '<div class="loading">Error loading orders. Make sure server is running.</div>';
    }
}

async function updateOrderStatus(id) {
    await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
    });
    loadAdminOrders();
    showToast('✅ Order marked as completed!');
}

async function reserveTable() {
    const name = document.getElementById('resName')?.value;
    const phone = document.getElementById('resPhone')?.value;
    const date = document.getElementById('resDate')?.value;
    const time = document.getElementById('resTime')?.value;
    const guests = document.getElementById('resGuests')?.value;
    
    if (!name || !phone || !date || !guests) {
        showToast('❌ Please fill all reservation fields!');
        return;
    }
    
    try {
        const response = await fetch('/api/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer_name: name, customer_phone: phone, reservation_date: date, reservation_time: time, guests: parseInt(guests) })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(`✅ Table booked! Reservation #${data.reservationId}`);
            document.getElementById('resName').value = '';
            document.getElementById('resPhone').value = '';
            document.getElementById('resDate').value = '';
            document.getElementById('resGuests').value = '';
        } else {
            showToast('❌ Reservation failed!');
        }
    } catch (error) {
        showToast('❌ Server error!');
    }
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    toast.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#ff6b35; color:white; padding:12px 20px; border-radius:8px; z-index:9999; animation:fadeIn 0.3s ease;';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function closeWelcome() {
    const popup = document.getElementById('welcomePopup');
    if (popup) popup.style.display = 'none';
}

// Make functions global
window.addToCart = addToCart;
window.updateQty = updateQty;
window.selectPayment = selectPayment;
window.placeOrder = placeOrder;
window.updateOrderStatus = updateOrderStatus;
window.reserveTable = reserveTable;
window.closeWelcome = closeWelcome;

// Event listeners
if (document.getElementById('reserveBtn')) {
    document.getElementById('reserveBtn').addEventListener('click', reserveTable);
}
if (document.getElementById('placeOrderBtn')) {
    console.log("Found placeOrderBtn, attaching event");
    document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);
} else {
    console.log("placeOrderBtn NOT found on this page");
}
if (document.querySelector('.menu-toggle')) {
    document.querySelector('.menu-toggle').addEventListener('click', () => {
        document.querySelector('.nav-links').classList.toggle('active');
    });
}

// Initialize
loadMenuPage();
loadAdminOrders();
setInterval(loadAdminOrders, 10000);
updateCartUI();

console.log("Script loaded! Cart ready:", cart);

