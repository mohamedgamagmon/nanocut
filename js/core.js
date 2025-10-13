// js/core.js - الوظائف الأساسية المصححة
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentPage = 'home';
let pageHistory = ['home'];

// تحميل البيانات عند بدء التشغيل
document.addEventListener('DOMContentLoaded', async function() {
    updateCartCount();
    await loadProductsData();
    loadNewProducts();
    
    // التعامل مع الـ hash في URL عند تحميل الصفحة
    const hash = window.location.hash.replace('#', '');
    if (hash && hash !== 'home') {
        showPage(hash);
    } else {
        showPage('home');
    }
    
    // إعداد مستمعي الأحداث
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
        searchBox.addEventListener('input', function(e) {
            generateRealTimeSuggestions(e.target.value);
        });

        searchBox.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const suggestionsContainer = document.getElementById('searchSuggestions');
                if (suggestionsContainer) {
                    suggestionsContainer.style.display = 'none';
                }
                performSearch();
            }
        });
    }

    const deliveryMethod = document.getElementById('deliveryMethod');
    if (deliveryMethod) {
        deliveryMethod.addEventListener('change', handleDeliveryMethodChange);
    }

    // إخفاء الاقتراحات عند النقر خارجها
    document.addEventListener('click', function(e) {
        const searchContainer = document.querySelector('.search-container');
        const suggestionsContainer = document.getElementById('searchSuggestions');
        
        if (searchContainer && suggestionsContainer && !searchContainer.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
        }
    });

    // تفعيل زر Back في المتصفح
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.page) {
            // إزالة آخر عنصر من pageHistory علشان ما يتكررش
            if (pageHistory.length > 1) {
                pageHistory.pop();
            }
            showPage(event.state.page);
        } else {
            // لو مفيش state، ارجع للهوم
            pageHistory = ['home'];
            showPage('home');
        }
    });
});

// تحميل البيانات من JSON
async function loadProductsData() {
    try {
        const response = await fetch('products.json');
        const data = await response.json();
        products = data.products;
    } catch (error) {
        console.error('Error loading products:', error);
        products = [];
    }
}

// تحديث عداد السلة
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        cartCount.textContent = totalItems;
    }
}

// إضافة منتج للسلة
function addToCart(productId, productName, productPrice, productImage) {
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: parseFloat(productPrice.replace('$', '')),
            image: productImage,
            quantity: 1
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showNotification(`"${productName}" added to cart!`);
}

// إزالة منتج من السلة
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    loadCartPage();
}

// تحميل صفحة السلة
function loadCartPage() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    if (!cartItems) return;

    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty</p>';
        if (cartTotal) cartTotal.textContent = '$0.00';
        return;
    }

    let total = 0;
    cartItems.innerHTML = '';

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)} x ${item.quantity}</div>
            </div>
            <div class="cart-item-total">$${itemTotal.toFixed(2)}</div>
            <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
                <i class="fas fa-trash"></i>
            </button>
        `;
        cartItems.appendChild(cartItem);
    });

    if (cartTotal) cartTotal.textContent = `$${total.toFixed(2)}`;
}

// فتح البحث
function openSearch() {
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
        searchBox.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// توليد الاقتراحات
function generateRealTimeSuggestions(query) {
    if (!query || query.length < 2) {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
        return;
    }

    const queryLower = query.toLowerCase();
    
    // البحث في المنتجات
    const matchingProducts = products.filter(product => {
        return product.name.toLowerCase().includes(queryLower) || 
               product.description.toLowerCase().includes(queryLower) ||
               product.category.toLowerCase().includes(queryLower) ||
               product.brand.toLowerCase().includes(queryLower);
    });

    // استخراج الكلمات المفتاحية
    const keywords = new Set();
    const categories = new Set();
    const brands = new Set();

    products.forEach(product => {
        const words = product.name.toLowerCase().split(' ');
        words.forEach(word => {
            if (word.includes(queryLower) && word.length > 2) {
                keywords.add(word);
            }
        });

        if (product.category.toLowerCase().includes(queryLower)) {
            categories.add(product.category);
        }
        if (product.brand.toLowerCase().includes(queryLower)) {
            brands.add(product.brand);
        }
    });

    // عرض الاقتراحات
    const suggestionsContainer = document.getElementById('searchSuggestions');
    if (!suggestionsContainer) return;

    let suggestionsHTML = '';

    if (matchingProducts.length > 0) {
        suggestionsHTML += `
            <div class="suggestion-group">
                <div class="suggestion-group-title">PRODUCTS</div>
        `;

        matchingProducts.slice(0, 5).forEach(product => {
            suggestionsHTML += `
                <div class="suggestion-item" onclick="selectProductSuggestion('${product.id}')">
                    <i class="fas fa-box"></i>
                    <div class="suggestion-text">${product.name}</div>
                </div>
            `;
        });

        suggestionsHTML += `</div>`;
    }

    if (categories.size > 0) {
        suggestionsHTML += `
            <div class="suggestion-group">
                <div class="suggestion-group-title">CATEGORIES</div>
        `;

        Array.from(categories).slice(0, 3).forEach(category => {
            suggestionsHTML += `
                <div class="suggestion-item" onclick="selectCategorySuggestion('${category}')">
                    <i class="fas fa-folder"></i>
                    <div class="suggestion-text">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
                </div>
            `;
        });

        suggestionsHTML += `</div>`;
    }

    if (brands.size > 0) {
        suggestionsHTML += `
            <div class="suggestion-group">
                <div class="suggestion-group-title">BRANDS</div>
        `;

        Array.from(brands).slice(0, 3).forEach(brand => {
            suggestionsHTML += `
                <div class="suggestion-item" onclick="selectBrandSuggestion('${brand}')">
                    <i class="fas fa-tag"></i>
                    <div class="suggestion-text">${brand.charAt(0).toUpperCase() + brand.slice(1)}</div>
                </div>
            `;
        });

        suggestionsHTML += `</div>`;
    }

    if (keywords.size > 0) {
        suggestionsHTML += `
            <div class="suggestion-group">
                <div class="suggestion-group-title">SUGGESTIONS</div>
        `;

        Array.from(keywords).slice(0, 5).forEach(keyword => {
            suggestionsHTML += `
                <div class="suggestion-item" onclick="selectKeywordSuggestion('${keyword}')">
                    <i class="fas fa-search"></i>
                    <div class="suggestion-text">${keyword}</div>
                </div>
            `;
        });

        suggestionsHTML += `</div>`;
    }

    if (matchingProducts.length === 0 && keywords.size === 0 && categories.size === 0 && brands.size === 0) {
        suggestionsHTML = `<div class="search-for">Search for "${query}"</div>`;
    } else {
        suggestionsHTML += `<div class="search-for">Search for "${query}"</div>`;
    }

    suggestionsContainer.innerHTML = suggestionsHTML;
    suggestionsContainer.style.display = 'block';
}

// اختيار اقتراح منتج
function selectProductSuggestion(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
        showProductDetail(productId);
    }
}

// اختيار اقتراح فئة
function selectCategorySuggestion(category) {
    const searchBox = document.getElementById('searchBox');
    const suggestionsContainer = document.getElementById('searchSuggestions');
    
    if (searchBox) searchBox.value = category;
    if (suggestionsContainer) suggestionsContainer.style.display = 'none';
    
    showCategory(category);
}

// اختيار اقتراح علامة تجارية
function selectBrandSuggestion(brand) {
    const searchBox = document.getElementById('searchBox');
    const suggestionsContainer = document.getElementById('searchSuggestions');
    
    if (searchBox) searchBox.value = brand;
    if (suggestionsContainer) suggestionsContainer.style.display = 'none';

    // البحث عن المنتجات التي تنتمي لهذه العلامة التجارية
    const searchResults = products.filter(product => product.brand === brand);

    // عرض نتائج البحث
    const searchQueryElement = document.getElementById('searchQuery');
    const resultsCountElement = document.getElementById('resultsCount');
    
    if (searchQueryElement) searchQueryElement.textContent = brand;
    if (resultsCountElement) resultsCountElement.textContent = searchResults.length;

    const searchResultsContainer = document.getElementById('searchResults');
    if (searchResultsContainer) {
        searchResultsContainer.innerHTML = '';

        if (searchResults.length === 0) {
            searchResultsContainer.innerHTML = '<p>No products found for this brand.</p>';
        } else {
            searchResults.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.onclick = () => showProductDetail(product.id);
                productCard.innerHTML = `
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-formats">${product.formats}</div>
                    <div class="product-price">${product.price}</div>
                    <button class="add-to-cart" onclick="event.stopPropagation(); addToCart('${product.id}', '${product.name}', '${product.price}', '${product.image}')">Add to Cart</button>
                `;
                searchResultsContainer.appendChild(productCard);
            });
        }
    }

    showPage('searchResults');
}

// اختيار اقتراح كلمة مفتاحية
function selectKeywordSuggestion(keyword) {
    const searchBox = document.getElementById('searchBox');
    const suggestionsContainer = document.getElementById('searchSuggestions');
    
    if (searchBox) searchBox.value = keyword;
    if (suggestionsContainer) suggestionsContainer.style.display = 'none';
    
    performSearch();
}

// البحث
function performSearch() {
    const searchBox = document.getElementById('searchBox');
    if (!searchBox) return;

    const searchTerm = searchBox.value.trim().toLowerCase();

    if (searchTerm === '') {
        alert('Please enter a search term');
        return;
    }

    const searchResults = products.filter(product => {
        const searchTerms = searchTerm.split(' ');
        return searchTerms.some(term => 
            product.name.toLowerCase().includes(term) || 
            product.description.toLowerCase().includes(term) ||
            product.category.toLowerCase().includes(term) ||
            product.brand.toLowerCase().includes(term)
        );
    });

    // عرض نتائج البحث
    const searchQueryElement = document.getElementById('searchQuery');
    const resultsCountElement = document.getElementById('resultsCount');
    
    if (searchQueryElement) searchQueryElement.textContent = searchTerm;
    if (resultsCountElement) resultsCountElement.textContent = searchResults.length;

    const searchResultsContainer = document.getElementById('searchResults');
    if (searchResultsContainer) {
        searchResultsContainer.innerHTML = '';

        if (searchResults.length === 0) {
            searchResultsContainer.innerHTML = '<p>No products found matching your search.</p>';
        } else {
            searchResults.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.onclick = () => showProductDetail(product.id);
                productCard.innerHTML = `
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-formats">${product.formats}</div>
                    <div class="product-price">${product.price}</div>
                    <button class="add-to-cart" onclick="event.stopPropagation(); addToCart('${product.id}', '${product.name}', '${product.price}', '${product.image}')">Add to Cart</button>
                `;
                searchResultsContainer.appendChild(productCard);
            });
        }
    }

    showPage('searchResults');
}

// معالجة الدفع
function processPayment() {
    const deliveryMethod = document.getElementById('deliveryMethod');
    const contactInfo = document.getElementById('contactInfo');

    if (!deliveryMethod || !deliveryMethod.value) {
        alert('Please select how you would like to receive your files');
        return;
    }

    if (deliveryMethod.value !== 'email' && (!contactInfo || !contactInfo.value || contactInfo.value.trim() === '')) {
        alert('Please provide your contact information for file delivery');
        return;
    }

    const notes = document.getElementById('notes');
    const paypalEmail = document.getElementById('paypalEmail');

    if (!paypalEmail || !paypalEmail.value) {
        alert('Please enter your PayPal email');
        return;
    }

    // محاكاة عملية الدفع
    alert('Payment processed successfully! Thank you for your purchase.');

    // تفريغ السلة
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    // العودة للصفحة الرئيسية
    showPage('home');
}

// تحميل المنتجات الجديدة
function loadNewProducts() {
    const container = document.getElementById('newProducts');
    if (!container) return;

    // فلتر المنتجات الجديدة (آخر شهرين)
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const newProducts = products.filter(product => {
        const productDate = new Date(product.dateAdded);
        return productDate >= twoMonthsAgo;
    });

    if (newProducts.length > 0) {
        container.innerHTML = newProducts.map(product => `
            <div class="product-card" onclick="showProductDetail('${product.id}')">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-formats">${product.formats}</div>
                <div class="product-price">${product.price}</div>
                <button class="add-to-cart" onclick="event.stopPropagation(); addToCart('${product.id}', '${product.name}', '${product.price}', '${product.image}')">Add to Cart</button>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<p>No new products available.</p>';
    }
}

// إظهار الصفحات
function showPage(pageId) {
    // حفظ الصفحة الحالية في السجل
    if (pageHistory[pageHistory.length - 1] !== pageId) {
        pageHistory.push(pageId);
        // إضافة للـ browser history
        history.pushState({ page: pageId }, '', `#${pageId}`);
    }

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
    });

    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
    }

    if (pageId === 'home') {
        const homeLink = document.querySelector('.nav-menu a');
        if (homeLink) homeLink.classList.add('active');
        loadNewProducts();
    } else if (pageId === 'cart') {
        loadCartPage();
    } else if (pageId === 'checkout') {
        updateCheckoutDisplay();
    }
    
    currentPage = pageId;
}

function showCategory(category) {
    showPage(category);
}

// تحديث صفحة الدفع
function updateCheckoutDisplay() {
    const checkoutTotalElement = document.getElementById('checkoutTotal');
    if (!checkoutTotalElement) return;

    let total = 0;
    cart.forEach(item => {
        total += item.price * item.quantity;
    });

    checkoutTotalElement.textContent = `$${total.toFixed(2)}`;
}

// وظائف العلامات التجارية
function showPhoneBrand(brand) {
    const brandNames = {
        apple: 'Apple iPhone',
        samsung: 'Samsung Galaxy',
        google: 'Google Pixel',
        oneplus: 'OnePlus',
        xiaomi: 'Xiaomi',
        huawei: 'Huawei',
        oppo: 'OPPO',
        vivo: 'Vivo',
        motorola: 'Motorola',
        nothing: 'Nothing Phone',
        realme: 'Realme',
        honor: 'Honor'
    };

    const titleElement = document.getElementById('phoneBrandTitle');
    if (titleElement) {
        titleElement.textContent = brandNames[brand] || brand;
    }
    
    loadBrandProducts('phoneBrand', brand, 'phones');
    showPage('phoneBrand');
}

function showTabletBrand(brand) {
    const brandNames = {
        apple: 'Apple iPad',
        samsung: 'Samsung Galaxy Tab',
        microsoft: 'Microsoft Surface',
        lenovo: 'Lenovo Tab',
        huawei: 'Huawei MatePad',
        xiaomi: 'Xiaomi Pad',
        amazon: 'Amazon Fire',
        google: 'Google Pixel Tab'
    };

    const titleElement = document.getElementById('tabletBrandTitle');
    if (titleElement) {
        titleElement.textContent = brandNames[brand] || brand;
    }
    
    loadBrandProducts('tabletBrand', brand, 'ipad');
    showPage('tabletBrand');
}

function showLaptopBrand(brand) {
    const brandNames = {
        apple: 'Apple MacBook',
        dell: 'Dell',
        hp: 'HP',
        lenovo: 'Lenovo',
        asus: 'ASUS',
        acer: 'Acer',
        microsoft: 'Microsoft Surface',
        msi: 'MSI',
        razer: 'Razer',
        samsung: 'Samsung Galaxy Book'
    };

    const titleElement = document.getElementById('laptopBrandTitle');
    if (titleElement) {
        titleElement.textContent = brandNames[brand] || brand;
    }
    
    loadBrandProducts('laptopBrand', brand, 'laptop');
    showPage('laptopBrand');
}

function showEarbudsBrand(brand) {
    const brandNames = {
        apple: 'Apple AirPods',
        samsung: 'Samsung Galaxy Buds',
        sony: 'Sony',
        bose: 'Bose',
        jbl: 'JBL',
        beats: 'Beats',
        anker: 'Anker Soundcore',
        xiaomi: 'Xiaomi'
    };

    const titleElement = document.getElementById('earbudsBrandTitle');
    if (titleElement) {
        titleElement.textContent = brandNames[brand] || brand;
    }
    
    loadBrandProducts('earbudsBrand', brand, 'airpods');
    showPage('earbudsBrand');
}

function showLensesBrand(brand) {
    const brandNames = {
        uwell: 'Uwell',
        smok: 'SMOK',
        vaporesso: 'Vaporesso',
        geekLenses: 'GeekLenses',
        voopoo: 'VooPoo',
        innokin: 'Innokin',
        aspire: 'Aspire',
        lostLenses: 'Lost Lenses'
    };

    const titleElement = document.getElementById('LensesBrandTitle');
    if (titleElement) {
        titleElement.textContent = brandNames[brand] || brand;
    }
    
    loadBrandProducts('LensesBrand', brand, 'Lenses');
    showPage('LensesBrand');
}

function showGamingBrand(brand) {
    const brandNames = {
        playstation: 'PlayStation',
        xbox: 'Xbox',
        nintendo: 'Nintendo',
        steam: 'Steam Deck',
        razer: 'Razer',
        logitech: 'Logitech',
        '8bitdo': '8BitDo',
        backbone: 'Backbone'
    };

    const titleElement = document.getElementById('gamingBrandTitle');
    if (titleElement) {
        titleElement.textContent = brandNames[brand] || brand;
    }
    
    loadBrandProducts('gamingBrand', brand, 'gaming');
    showPage('gamingBrand');
}

function showCameraBrand(brand) {
    const brandNames = {
        canon: 'Canon',
        nikon: 'Nikon',
        sony: 'Sony',
        fujifilm: 'Fujifilm',
        panasonic: 'Panasonic',
        olympus: 'Olympus',
        sigma: 'Sigma',
        tamron: 'Tamron'
    };

    const titleElement = document.getElementById('cameraBrandTitle');
    if (titleElement) {
        titleElement.textContent = brandNames[brand] || brand;
    }
    
    loadBrandProducts('cameraBrand', brand, 'camera');
    showPage('cameraBrand');
}

// تحميل منتجات العلامة التجارية
function loadBrandProducts(brandType, brand, category) {
    const container = document.getElementById(brandType + 'Products');
    if (!container) return;

    const brandProducts = products.filter(product => 
        product.brand === brand && product.category === category
    );

    if (brandProducts.length === 0) {
        container.innerHTML = '<p>No products available for this brand yet.</p>';
        return;
    }

    container.innerHTML = brandProducts.map(product => `
        <div class="product-card" onclick="showProductDetail('${product.id}')">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <div class="product-formats">${product.formats}</div>
            <div class="product-price">${product.price}</div>
            <button class="add-to-cart" onclick="event.stopPropagation(); addToCart('${product.id}', '${product.name}', '${product.price}', '${product.image}')">Add to Cart</button>
        </div>
    `).join('');
}

// عرض تفاصيل المنتج
function showProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const productDetailContent = document.getElementById('productDetailContent');
    if (!productDetailContent) return;

    productDetailContent.innerHTML = `
        <div class="product-image-large">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="product-info">
            <h1 class="product-detail-title">${product.name}</h1>
            <p class="product-detail-description">${product.fullDescription || product.description}</p>
            <div class="product-detail-price">${product.price}</div>
            <div class="product-detail-formats">Formats: <span>${product.formats}</span></div>

            <div class="product-meta">
                <div class="product-meta-item">
                    <div class="product-meta-label">Category:</div>
                    <div class="product-meta-value">${product.category.charAt(0).toUpperCase() + product.category.slice(1)}</div>
                </div>
                <div class="product-meta-item">
                    <div class="product-meta-label">Brand:</div>
                    <div class="product-meta-value">${product.brand.charAt(0).toUpperCase() + product.brand.slice(1)}</div>
                </div>
                <div class="product-meta-item">
                    <div class="product-meta-label">Features:</div>
                    <div class="product-meta-value">${(product.features || ['High quality', 'Precise measurements']).join(', ')}</div>
                </div>
                <div class="product-meta-item">
                    <div class="product-meta-label">Compatibility:</div>
                    <div class="product-meta-value">${(product.compatibility || ['Adobe Illustrator', 'CorelDRAW', 'Inkscape']).join(', ')}</div>
                </div>
            </div>

            <button class="add-to-cart" style="margin-top: 20px;" onclick="addToCart('${product.id}', '${product.name}', '${product.price}', '${product.image}')">Add to Cart</button>
        </div>
    `;

    showPage('productDetail');
}

// العودة للصفحة السابقة
function goBack() {
    if (pageHistory.length > 1) {
        pageHistory.pop();
        const previousPage = pageHistory[pageHistory.length - 1];
        showPage(previousPage);
    } else {
        showPage('home');
    }
}

// إدارة طريقة التوصيل
function handleDeliveryMethodChange() {
    const method = document.getElementById('deliveryMethod').value;
    const contactField = document.getElementById('contactInfoField');
    const contactLabel = document.getElementById('contactInfoLabel');
    const contactInput = document.getElementById('contactInfo');

    if (!contactField || !contactLabel || !contactInput) return;

    if (method === 'email') {
        contactField.style.display = 'none';
        contactInput.removeAttribute('required');
    } else {
        contactField.style.display = 'block';
        contactInput.setAttribute('required', 'required');

        if (method === 'whatsapp') {
            contactLabel.textContent = 'WhatsApp Number *';
            contactInput.placeholder = 'Enter your WhatsApp number (e.g., +1234567890)';
        } else if (method === 'telegram') {
            contactLabel.textContent = 'Telegram Username *';
            contactInput.placeholder = 'Enter your Telegram username (e.g., @username)';
        } else {
            contactLabel.textContent = 'Contact Information *';
            contactInput.placeholder = 'Please provide your contact details';
        }
    }
}

// إظهار الإشعار
function showNotification(message) {
    alert(message);
}