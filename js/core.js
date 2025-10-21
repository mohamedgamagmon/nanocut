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
        cartItems.innerHTML = '<p data-lang="cartEmpty">Your cart is empty</p>';
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
                    <button class="add-to-cart" onclick="event.stopPropagation(); addToCart('${product.id}', '${product.name}', '${product.price}', '${product.image}')">
    <span data-lang="addToCart">Add to Cart</span>
</button>
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
                    <button class="add-to-cart" onclick="event.stopPropagation(); addToCart('${product.id}', '${product.name}', '${product.price}', '${product.image}')">
    <span data-lang="addToCart">Add to Cart</span>
</button>
                `;
                searchResultsContainer.appendChild(productCard);
            });
        }
    }

    showPage('searchResults');
}

// معالجة الدفع - النظام النهائي
function processPayment() {
    const deliveryMethod = document.getElementById('deliveryMethod');
    const contactInfo = document.getElementById('contactInfo');
    const notes = document.getElementById('notes');
    const paypalEmail = document.getElementById('paypalEmail');

    if (!deliveryMethod || !deliveryMethod.value) {
        alert('Please select how you would like to receive your files');
        return;
    }

    if (deliveryMethod.value !== 'email' && (!contactInfo || !contactInfo.value || contactInfo.value.trim() === '')) {
        alert('Please provide your contact information for file delivery');
        return;
    }

    if (!paypalEmail || !paypalEmail.value) {
        alert('Please enter your PayPal email');
        return;
    }

    // حساب المبلغ الإجمالي
    let total = 0;
    cart.forEach(item => {
        total += item.price * item.quantity;
    });

    if (total === 0) {
        alert('Your cart is empty!');
        return;
    }

    // إنشاء Order ID
    const orderId = 'NANO-' + Date.now();

    // إنشاء رابط PayPal.Me - استبدل nanodxb باسمك في PayPal
    const paypalUsername = "skincut";
    const paypalLink = `https://paypal.me/${paypalUsername}/${total.toFixed(2)}USD`;
    
    // إنشاء ملاحظات للعميل يكتبها في PayPal
const orderNotes = `
🛒 ORDER DETAILS 🛒
Order ID: ${orderId}
Contact: ${deliveryMethod.value === 'email' ? paypalEmail.value : contactInfo.value}
Delivery: ${deliveryMethod.value}
Notes: ${notes.value}

📦 PRODUCTS:
${cart.map(item => `• ${item.name} x${item.quantity} - $${item.price}`).join('\n')}

💰 TOTAL: $${total.toFixed(2)}
`;
    // فتح صفحة الدفع
    const encodedNotes = encodeURIComponent(orderNotes);
    const finalPayPalLink = `${paypalLink}?text=${encodedNotes}`;
    
    window.open(finalPayPalLink, '_blank');
    
    // تفريغ السلة فوراً
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    // رسالة نجاح
    alert(`✅ Order #${orderId} Created!\n\nComplete payment in PayPal to receive your files.`);
    
    // العودة للصفحة الرئيسية
    showPage('home');
}

// تحميل المنتجات الجديدة
function loadNewProducts() {
    const container = document.getElementById('newProducts');
    if (!container) return;

    // فلتر المنتجات الجديدة
    const newProducts = products.filter(product => product.isNew === true);

    if (newProducts.length > 0) {
        container.innerHTML = newProducts.map(product => `
            <div class="product-card" onclick="showProductDetail('${product.id}')">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-formats">${product.formats}</div>
                <div class="product-price">${product.price}</div>
                <button class="add-to-cart" onclick="event.stopPropagation(); addToCart('${product.id}', '${product.name}', '${product.price}', '${product.image}')">
    <span data-lang="addToCart">Add to Cart</span>
</button>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<p>No new products available.</p>';
    }
}
// إظهار الصفحات
function showPage(pageId) {
    // تطبيق اللغة على الصفحة الجديدة
    const currentLang = localStorage.getItem('selectedLanguage') || 'en';
    setTimeout(() => {
        changeLanguage(currentLang);
    }, 50);
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
            <button class="add-to-cart" onclick="event.stopPropagation(); addToCart('${product.id}', '${product.name}', '${product.price}', '${product.image}')">
    <span data-lang="addToCart">Add to Cart</span>
</button>
        </div>
    `).join('');
}

// عرض تفاصيل المنتج
function showProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const productDetailContent = document.getElementById('productDetailContent');
    if (!productDetailContent) return;

    const currentLang = localStorage.getItem('selectedLanguage') || 'en';
    
    // الترجمات للمنتج
    const productTranslations = {
        en: {
            formatsIncluded: "Formats Included",
            templateFeatures: "Template Features",
            highQuality: "High quality vector files",
            preciseMeasurements: "Precise measurements",
            multipleFormats: "Multiple file formats",
            easyCustomize: "Easy to customize",
            category: "Category",
            brand: "Brand",
            compatibility: "Compatibility",
            addToCart: "Add to Cart"
        },
        ar: {
            formatsIncluded: "الصيغ المتضمنة",
            templateFeatures: "مميزات القالب",
            highQuality: "ملفات متجهة عالية الجودة",
            preciseMeasurements: "قياسات دقيقة",
            multipleFormats: "صيغ ملفات متعددة",
            easyCustomize: "سهل التخصيص",
            category: "الفئة",
            brand: "الماركة",
            compatibility: "التوافق",
            addToCart: "أضف إلى السلة"
        },
        es: {
            formatsIncluded: "Formatos Incluidos",
            templateFeatures: "Características de la Plantilla",
            highQuality: "Archivos vectoriales de alta calidad",
            preciseMeasurements: "Mediciones precisas",
            multipleFormats: "Múltiples formatos de archivo",
            easyCustomize: "Fácil de personalizar",
            category: "Categoría",
            brand: "Marca",
            compatibility: "Compatibilidad",
            addToCart: "Añadir al Carrito"
        },
        fr: {
            formatsIncluded: "Formats Inclus",
            templateFeatures: "Caractéristiques du Modèle",
            highQuality: "Fichiers vectoriels haute qualité",
            preciseMeasurements: "Mesures précises",
            multipleFormats: "Multiples formats de fichiers",
            easyCustomize: "Facile à personnaliser",
            category: "Catégorie",
            brand: "Marque",
            compatibility: "Compatibilité",
            addToCart: "Ajouter au Panier"
        },
        de: {
            formatsIncluded: "Enthaltene Formate",
            templateFeatures: "Vorlagenmerkmale",
            highQuality: "Hochwertige Vektordateien",
            preciseMeasurements: "Präzise Messungen",
            multipleFormats: "Mehrere Dateiformate",
            easyCustomize: "Einfach anzupassen",
            category: "Kategorie",
            brand: "Marke",
            compatibility: "Kompatibilität",
            addToCart: "In den Warenkorb"
        }
    };

    const lang = productTranslations[currentLang] || productTranslations.en;

    productDetailContent.innerHTML = `
        <div class="product-image-large" oncontextmenu="return false">
            <img src="${product.image}" alt="${product.name}" 
                 onerror="this.src='https://via.placeholder.com/800x600/000000/6c63ff?text=Product+Preview'"
                 ondragstart="return false">
        </div>
        <div class="product-info">
            <h1 class="product-detail-title">${product.name}</h1>
            <p class="product-detail-description">${product.fullDescription || product.description}</p>
            <div class="product-detail-price">${product.price}</div>
            <div class="product-detail-formats">
    <strong data-lang="formatsIncluded">Formats Included:</strong> <span>${product.formats}</span>
</div>

<div class="product-features">
    <h3 data-lang="templateFeatures">Template Features:</h3>
    <ul>
    ${(product.features || [
        '<span data-lang="highQuality">High quality vector files</span>',
        '<span data-lang="preciseMeasurements">Precise measurements</span>',
        '<span data-lang="multipleFormats">Multiple file formats</span>',
        '<span data-lang="easyCustomize">Easy to customize</span>'
    ]).map(feature => `
        <li>${feature}</li>
    `).join('')}
</ul>
</div>

<div class="product-meta">
    <div class="product-meta-item">
        <div class="product-meta-label" data-lang="category">Category:</div>
        <div class="product-meta-value">${product.category.charAt(0).toUpperCase() + product.category.slice(1)}</div>
    </div>
    <div class="product-meta-item">
        <div class="product-meta-label" data-lang="brand">Brand:</div>
        <div class="product-meta-value">${product.brand.charAt(0).toUpperCase() + product.brand.slice(1)}</div>
    </div>
    <div class="product-meta-item">
        <div class="product-meta-label" data-lang="compatibility">Compatibility:</div>
        <div class="product-meta-value">${(product.compatibility || ['Adobe Illustrator', 'CorelDRAW', 'Inkscape', 'Cricut Design Space']).join(', ')}</div>
    </div>
</div>

            <button class="add-to-cart-large" onclick="addToCart('${product.id}', '${product.name}', '${product.price}', '${product.image}')">
    <i class="fas fa-shopping-cart"></i> 
    <span data-lang="addToCart">Add to Cart</span> - ${product.price}
</button>
        </div>
    `;

        // تطبيق اللغة على صفحة المنتج
    setTimeout(() => { changeLanguage(localStorage.getItem('selectedLanguage') || 'en'); }, 100);
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
// تغيير اللغة
function changeLanguage(lang) {
    const languageTexts = {
    en: {
        home: "Home", phones: "Phones", ipad: "iPad & Tablets", laptop: "Laptops", airpods: "AirPods", Lenses: "Lenses", gaming: "Gaming Devices", camera: "Camera", cart: "Cart", searchPlaceholder: "Search for device models, brands, or templates...", createBundle: "Create Bundle", newArrivals: "New Arrivals", latestTemplates: "Latest skin templates added in the last 2 months", choosePayGet: "Choose, Pay, and Get Your Files!", selectDesign: "Select your design, complete payment, and receive your files instantly", chooseDesign: "Choose Design", securePayment: "Secure Payment", instantDownload: "Instant Download", startWorking: "Start Working", shoppingCart: "Shopping Cart", total: "Total", proceedCheckout: "Proceed to Checkout", cartEmpty: "Your cart is empty", checkout: "Checkout", deliveryInfo: "Delivery Information", notesDelivery: "Notes for Delivery", receiveFiles: "How would you like to receive your files? *", deliveryMethod: "Select delivery method", emailOption: "Email (will use your PayPal email)", whatsappOption: "WhatsApp", telegramOption: "Telegram", otherOption: "Other", contactInfo: "Contact Information *", paymentMethod: "Payment Method", totalAmount: "Total Amount", paypalMethod: "PayPal", paypalEmail: "PayPal Email", completePurchase: "Complete Purchase", chooseBrand: "Choose your brand", choosePhoneBrand: "Choose your phone brand", chooseTabletBrand: "Choose your tablet brand", chooseLaptopBrand: "Choose your laptop brand", chooseEarbudsBrand: "Choose your earbuds brand", chooseLensesBrand: "Choose your Lenses brand", chooseGamingBrand: "Choose your gaming device", chooseCameraBrand: "Choose your camera brand", aboutNanocut: "About Nanocut", aboutDescription: "Premium device skin templates for professionals and enthusiasts. High-quality cut files for various devices and brands.", contactInfo: "Contact Info", supportEmail: "support@nanocut.com", phoneNumber: "+1 (555) 123-4567", whatsappNumber: "+1 (555) 123-4567", workingHours: "Mon - Fri: 9 AM - 6 PM EST", copyright: "© 2024 Nanocut. All rights reserved.", addToCart: "Add to Cart", formatsIncluded: "Formats Included", templateFeatures: "Template Features", highQuality: "High quality vector files", preciseMeasurements: "Precise measurements", multipleFormats: "Multiple file formats", easyCustomize: "Easy to customize", category: "Category", brand: "Brand", compatibility: "Compatibility", adobeIllustrator: "Adobe Illustrator", coreldraw: "CorelDRAW", inkscape: "Inkscape", cricutDesign: "Cricut Design Space", searchResults: "Search Results", foundResults: "Found results for", noResults: "No products found matching your search", suggestionProducts: "PRODUCTS", suggestionCategories: "CATEGORIES", suggestionBrands: "BRANDS", suggestionSuggestions: "SUGGESTIONS",backToProducts: "Back to Products", searchFor: "Search for"
    },
    ar: {
        home: "الرئيسية", phones: "هواتف", ipad: "آيباد وأجهزة لوحية", laptop: "لابتوبات", airpods: "ايربودز", Lenses: "عدسات", gaming: "أجهزة الألعاب", camera: "كاميرات", cart: "عربة التسوق", searchPlaceholder: "ابحث عن موديلات الأجهزة، الماركات، أو القوالب...", createBundle: "إنشاء باقة", newArrivals: "المنتجات الجديدة", latestTemplates: "أحدث قوالب الاسكين المضافة خلال الشهرين الماضيين", choosePayGet: "اختر، ادفع، واحصل على ملفاتك!", selectDesign: "اختر تصميمك، أكمل الدفع، واستلم ملفاتك فوراً", chooseDesign: "اختر التصميم", securePayment: "دفع آمن", instantDownload: "تحميل فوري", startWorking: "ابدأ العمل", shoppingCart: "عربة التسوق", total: "المجموع", proceedCheckout: "إتمام الشراء", cartEmpty: "عربة التسوق فارغة", checkout: "الدفع", deliveryInfo: "معلومات التوصيل", notesDelivery: "ملاحظات للتوصيل", receiveFiles: "كيف تريد استلام ملفاتك؟ *", deliveryMethod: "اختر طريقة التوصيل", emailOption: "بريد إلكتروني (سيستخدم بريد PayPal الخاص بك)", whatsappOption: "واتساب", telegramOption: "تيليجرام", otherOption: "أخرى", contactInfo: "معلومات الاتصال *", paymentMethod: "طريقة الدفع", totalAmount: "المبلغ الإجمالي", paypalMethod: "باي بال", paypalEmail: "بريد باي بال", completePurchase: "إتمام الشراء", chooseBrand: "اختر الماركة", choosePhoneBrand: "اختر ماركة هاتفك", chooseTabletBrand: "اختر ماركة جهازك اللوحي", chooseLaptopBrand: "اختر ماركة لابتوبك", chooseEarbudsBrand: "اختر ماركة السماعات", chooseLensesBrand: "اختر ماركة العدسات", chooseGamingBrand: "اختر جهاز الألعاب", chooseCameraBrand: "اختر ماركة الكاميرا", aboutNanocut: "عن نانوكت", aboutDescription: "قوالب سكين احترافية للأجهزة للمحترفين والهواة. ملفات قص عالية الجودة لأجهزة وماركات متنوعة.", contactInfo: "معلومات الاتصال", supportEmail: "support@nanocut.com", phoneNumber: "+1 (555) 123-4567", whatsappNumber: "+1 (555) 123-4567", workingHours: "الإثنين - الجمعة: 9 ص - 6 م", copyright: "© 2024 نانوكت. جميع الحقوق محفوظة.", addToCart: "أضف إلى السلة", formatsIncluded: "الصيغ المتضمنة", templateFeatures: "مميزات القالب", highQuality: "ملفات متجهة عالية الجودة", preciseMeasurements: "قياسات دقيقة", multipleFormats: "صيغ ملفات متعددة", easyCustomize: "سهل التخصيص", category: "الفئة", brand: "الماركة", compatibility: "التوافق", adobeIllustrator: "أدوبي إليستريتور", coreldraw: "كوريل درو", inkscape: "إنك سكيب", cricutDesign: "كريكت ديزاين سبيس", searchResults: "نتائج البحث", foundResults: "تم العثور على نتيجة لـ", noResults: "لم يتم العثور على منتجات تطابق بحثك", suggestionProducts: "المنتجات", suggestionCategories: "الفئات", suggestionBrands: "الماركات", suggestionSuggestions: "اقتراحات",backToProducts: "العودة للمنتجات",highQuality: "ملفات متجهة عالية الجودة", preciseMeasurements: "قياسات دقيقة", multipleFormats: "صيغ ملفات متعددة", easyCustomize: "سهل التخصيص", searchFor: "ابحث عن"
    },
    es: {
        home: "Inicio", phones: "Teléfonos", ipad: "iPad y Tabletas", laptop: "Portátiles", airpods: "AirPods", Lenses: "Lentes", gaming: "Dispositivos Gaming", camera: "Cámaras", cart: "Carrito", searchPlaceholder: "Buscar modelos, marcas o plantillas...", createBundle: "Crear Paquete", newArrivals: "Nuevos Productos", latestTemplates: "Plantillas agregadas en los últimos 2 meses", choosePayGet: "¡Elige, Paga y Recibe tus Archivos!", selectDesign: "Selecciona tu diseño, completa el pago y recibe tus archivos al instante", chooseDesign: "Elegir Diseño", securePayment: "Pago Seguro", instantDownload: "Descarga Instantánea", startWorking: "Comenzar a Trabajar", shoppingCart: "Carrito de Compras", total: "Total", proceedCheckout: "Proceder al Pago", cartEmpty: "Tu carrito está vacío", checkout: "Pago", deliveryInfo: "Información de Entrega", notesDelivery: "Notas para la Entrega", receiveFiles: "¿Cómo quieres recibir tus archivos? *", deliveryMethod: "Seleccionar método de entrega", emailOption: "Email (usará su email de PayPal)", whatsappOption: "WhatsApp", telegramOption: "Telegram", otherOption: "Otro", contactInfo: "Información de Contacto *", paymentMethod: "Método de Pago", totalAmount: "Monto Total", paypalMethod: "PayPal", paypalEmail: "Email de PayPal", completePurchase: "Completar Compra", chooseBrand: "Elige tu marca", choosePhoneBrand: "Elige la marca de tu teléfono", chooseTabletBrand: "Elige la marca de tu tableta", chooseLaptopBrand: "Elige la marca de tu portátil", chooseEarbudsBrand: "Elige la marca de tus auriculares", chooseLensesBrand: "Elige la marca de tus lentes", chooseGamingBrand: "Elige tu dispositivo gaming", chooseCameraBrand: "Elige la marca de tu cámara", aboutNanocut: "Acerca de Nanocut", aboutDescription: "Plantillas premium de skins para dispositivos para profesionales y entusiastas. Archivos de corte de alta calidad para varios dispositivos y marcas.", contactInfo: "Información de Contacto", supportEmail: "support@nanocut.com", phoneNumber: "+1 (555) 123-4567", whatsappNumber: "+1 (555) 123-4567", workingHours: "Lun - Vie: 9 AM - 6 PM EST", copyright: "© 2024 Nanocut. Todos los derechos reservados.", addToCart: "Añadir al Carrito", formatsIncluded: "Formatos Incluidos", templateFeatures: "Características de la Plantilla", highQuality: "Archivos vectoriales de alta calidad", preciseMeasurements: "Mediciones precisas", multipleFormats: "Múltiples formatos de archivo", easyCustomize: "Fácil de personalizar", category: "Categoría", brand: "Marca", compatibility: "Compatibilidad", adobeIllustrator: "Adobe Illustrator", coreldraw: "CorelDRAW", inkscape: "Inkscape", cricutDesign: "Cricut Design Space", searchResults: "Resultados de Búsqueda", foundResults: "Se encontraron resultados para", noResults: "No se encontraron productos que coincidan con tu búsqueda", suggestionProducts: "PRODUCTOS", suggestionCategories: "CATEGORÍAS", suggestionBrands: "MARCAS", suggestionSuggestions: "SUGERENCIAS",backToProducts: "Volver a Productos",highQuality: "Archivos vectoriales de alta calidad", preciseMeasurements: "Mediciones precisas", multipleFormats: "Múltiples formatos de archivo", easyCustomize: "Fácil de personalizar", searchFor: "Buscar"
    },
    fr: {
        home: "Accueil", phones: "Téléphones", ipad: "iPad et Tablettes", laptop: "Ordinateurs", airpods: "AirPods", Lenses: "Objectifs", gaming: "Appareils Gaming", camera: "Caméras", cart: "Panier", searchPlaceholder: "Rechercher modèles, marques ou modèles...", createBundle: "Créer un Pack", newArrivals: "Nouveautés", latestTemplates: "Modèles ajoutés ces 2 derniers mois", choosePayGet: "Choisissez, Payez et Recevez vos Fichiers !", selectDesign: "Sélectionnez votre design, complétez le paiement et recevez vos fichiers instantanément", chooseDesign: "Choisir Design", securePayment: "Paiement Sécurisé", instantDownload: "Téléchargement Instantané", startWorking: "Commencer à Travailler", shoppingCart: "Panier d'Achat", total: "Total", proceedCheckout: "Procéder au Paiement", cartEmpty: "Votre panier est vide", checkout: "Paiement", deliveryInfo: "Informations de Livraison", notesDelivery: "Notes pour la Livraison", receiveFiles: "Comment recevoir vos fichiers ? *", deliveryMethod: "Sélectionner méthode livraison", emailOption: "Email (utilisera votre email PayPal)", whatsappOption: "WhatsApp", telegramOption: "Telegram", otherOption: "Autre", contactInfo: "Informations de Contact *", paymentMethod: "Méthode de Paiement", totalAmount: "Montant Total", paypalMethod: "PayPal", paypalEmail: "Email PayPal", completePurchase: "Finaliser l'Achat", chooseBrand: "Choisissez votre marque", choosePhoneBrand: "Choisissez la marque de votre téléphone", chooseTabletBrand: "Choisissez la marque de votre tablette", chooseLaptopBrand: "Choisissez la marque de votre ordinateur", chooseEarbudsBrand: "Choisissez la marque de vos écouteurs", chooseLensesBrand: "Choisissez la marque de vos objectifs", chooseGamingBrand: "Choisissez votre appareil gaming", chooseCameraBrand: "Choisissez la marque de votre appareil photo", aboutNanocut: "À propos de Nanocut", aboutDescription: "Modèles premium de skins pour appareils pour professionnels et passionnés. Fichiers de découpe haute qualité pour divers appareils et marques.", contactInfo: "Informations de Contact", supportEmail: "support@nanocut.com", phoneNumber: "+1 (555) 123-4567", whatsappNumber: "+1 (555) 123-4567", workingHours: "Lun - Ven: 9h - 18h EST", copyright: "© 2024 Nanocut. Tous droits réservés.", addToCart: "Ajouter au Panier", formatsIncluded: "Formats Inclus", templateFeatures: "Caractéristiques du Modèle", highQuality: "Fichiers vectoriels haute qualité", preciseMeasurements: "Mesures précises", multipleFormats: "Multiples formats de fichiers", easyCustomize: "Facile à personnaliser", category: "Catégorie", brand: "Marque", compatibility: "Compatibilité", adobeIllustrator: "Adobe Illustrator", coreldraw: "CorelDRAW", inkscape: "Inkscape", cricutDesign: "Cricut Design Space", searchResults: "Résultats de Recherche", foundResults: "Résultats trouvés pour", noResults: "Aucun produit trouvé correspondant à votre recherche", suggestionProducts: "PRODUITS", suggestionCategories: "CATÉGORIES", suggestionBrands: "MARQUES", suggestionSuggestions: "SUGGESTIONS",backToProducts: "Retour aux Produits",highQuality: "Fichiers vectoriels haute qualité", preciseMeasurements: "Mesures précises", multipleFormats: "Multiples formats de fichiers", easyCustomize: "Facile à personnaliser", searchFor: "Rechercher"
    },
    de: {
        home: "Startseite", phones: "Handys", ipad: "iPad & Tablets", laptop: "Laptops", airpods: "AirPods", Lenses: "Objektive", gaming: "Gaming-Geräte", camera: "Kameras", cart: "Warenkorb", searchPlaceholder: "Nach Modellen, Marken oder Vorlagen suchen...", createBundle: "Paket Erstellen", newArrivals: "Neuheiten", latestTemplates: "Neueste Vorlagen der letzten 2 Monate", choosePayGet: "Wählen, Bezahlen und Ihre Dateien Erhalten!", selectDesign: "Wählen Sie Ihr Design, schließen Sie die Zahlung ab und erhalten Sie sofort Ihre Dateien", chooseDesign: "Design Wählen", securePayment: "Sichere Zahlung", instantDownload: "Sofortiger Download", startWorking: "Starten Sie die Arbeit", shoppingCart: "Warenkorb", total: "Gesamtsumme", proceedCheckout: "Zur Kasse", cartEmpty: "Ihr Warenkorb ist leer", checkout: "Kasse", deliveryInfo: "Lieferinformationen", notesDelivery: "Hinweise zur Lieferung", receiveFiles: "Wie möchten Sie Ihre Dateien erhalten? *", deliveryMethod: "Liefermethode auswählen", emailOption: "E-Mail (verwendet Ihre PayPal-E-Mail)", whatsappOption: "WhatsApp", telegramOption: "Telegram", otherOption: "Andere", contactInfo: "Kontaktinformation *", paymentMethod: "Zahlungsmethode", totalAmount: "Gesamtbetrag", paypalMethod: "PayPal", paypalEmail: "PayPal E-Mail", completePurchase: "Kauf Abschließen", chooseBrand: "Wählen Sie Ihre Marke", choosePhoneBrand: "Wählen Sie Ihre Handymarke", chooseTabletBrand: "Wählen Sie Ihre Tablettmarke", chooseLaptopBrand: "Wählen Sie Ihre Laptop-Marke", chooseEarbudsBrand: "Wählen Sie Ihre Kopfhörermarke", chooseLensesBrand: "Wählen Sie Ihre Objektivmarke", chooseGamingBrand: "Wählen Sie Ihr Gaming-Gerät", chooseCameraBrand: "Wählen Sie Ihre Kameramarke", aboutNanocut: "Über Nanocut", aboutDescription: "Premium-Geräte-Skin-Vorlagen für Profis und Enthusiasten. Hochwertige Schneidedateien für verschiedene Geräte und Marken.", contactInfo: "Kontaktinformation", supportEmail: "support@nanocut.com", phoneNumber: "+1 (555) 123-4567", whatsappNumber: "+1 (555) 123-4567", workingHours: "Mo - Fr: 9 - 18 Uhr EST", copyright: "© 2024 Nanocut. Alle Rechte vorbehalten.", addToCart: "In den Warenkorb", formatsIncluded: "Enthaltene Formate", templateFeatures: "Vorlagenmerkmale", highQuality: "Hochwertige Vektordateien", preciseMeasurements: "Präzise Messungen", multipleFormats: "Mehrere Dateiformate", easyCustomize: "Einfach anzupassen", category: "Kategorie", brand: "Marke", compatibility: "Kompatibilität", adobeIllustrator: "Adobe Illustrator", coreldraw: "CorelDRAW", inkscape: "Inkscape", cricutDesign: "Cricut Design Space", searchResults: "Suchergebnisse", foundResults: "Gefundene Ergebnisse für", noResults: "Keine Produkte gefunden, die Ihrer Suche entsprechen", suggestionProducts: "PRODUKTE", suggestionCategories: "KATEGORIEN", suggestionBrands: "MARKEN", suggestionSuggestions: "VORSCHLÄGE",backToProducts: "Zurück zu Produkten",highQuality: "Hochwertige Vektordateien", preciseMeasurements: "Präzise Messungen", multipleFormats: "Mehrere Dateiformate", easyCustomize: "Einfach anzupassen", searchFor: "Suchen nach"
    }
};

    // تغيير النصوص في الصفحة
    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (languageTexts[lang] && languageTexts[lang][key]) {
            element.textContent = languageTexts[lang][key];
        }
    });
// معالجة صفحة المنتج إذا كانت مفتوحة - هذه الإضافة الجديدة
if (document.getElementById('productDetailPage') && document.getElementById('productDetailPage').classList.contains('active')) {
    document.querySelectorAll('#productDetailContent [data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (languageTexts[lang] && languageTexts[lang][key]) {
            element.textContent = languageTexts[lang][key];
        }
    });
}
    // تغيير placeholder في search box
    const searchBox = document.getElementById('searchBox');
    if (searchBox && languageTexts[lang] && languageTexts[lang].searchPlaceholder) {
        searchBox.placeholder = languageTexts[lang].searchPlaceholder;
    }

    // حفظ اللغة المختارة
    localStorage.setItem('selectedLanguage', lang);
    
    // رسالة تأكيد
    // إشعار بصري بدل التنبيه
const langNames = { en: 'English', ar: 'العربية', es: 'Español', fr: 'Français', de: 'Deutsch' };
console.log(`Language changed to ${langNames[lang]}`); // فقط في الكونسول
}

// تحميل اللغة المحفوظة عند بدء التشغيل
document.addEventListener('DOMContentLoaded', function() {
    const savedLang = localStorage.getItem('selectedLanguage') || 'en';
    const select = document.querySelector('.language-switcher select');
    if (select) {
        select.value = savedLang;
        changeLanguage(savedLang);
    }
});
// إظهار الإشعار
function showNotification(message) {
    alert(message);
}