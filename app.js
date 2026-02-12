// MarketX - Aplicativo de Marketplace
// Inicialização e Estado Global

let supabase;
let currentUser = null;
let currentCurrency = 'MZN';
let currentCategory = 'all';
let currentSort = 'recent';
let allProducts = [];
let selectedImages = [];

// Inicialização do Supabase
function initSupabase() {
    try {
        if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey || 
            SUPABASE_CONFIG.url.includes('SUA_SUPABASE') || 
            SUPABASE_CONFIG.anonKey.includes('SUA_SUPABASE')) {
            console.warn('⚠️ Supabase não configurado. Configure as credenciais em config.js');
            console.warn('📖 Instruções detalhadas em config.js');
            return false;
        }

        supabase = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );
        
        console.log('✅ Supabase inicializado com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error);
        console.warn('💡 Certifique-se de incluir a biblioteca do Supabase no HTML');
        console.warn('💡 Adicione: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
        return false;
    }
}

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando MarketX...');
    
    // Verificar se Supabase está disponível
    if (typeof window.supabase === 'undefined') {
        console.warn('⚠️ Biblioteca Supabase não carregada.');
        console.warn('💡 Adicione no HTML antes do app.js:');
        console.warn('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
    } else {
        initSupabase();
    }
    
    // Inicializar componentes
    initEventListeners();
    checkUserSession();
    await loadProducts();
    
    // Esconder loading screen
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
    }, 1000);
});

// Event Listeners
function initEventListeners() {
    // Navegação
    document.getElementById('loginBtn')?.addEventListener('click', showAuthModal);
    document.getElementById('userMenuBtn')?.addEventListener('click', toggleUserDropdown);
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    
    // Auth Modal
    document.getElementById('showRegister')?.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
    });
    
    document.getElementById('showLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });
    
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
    
    // Produtos
    document.getElementById('addProductLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        showAddProductModal();
    });
    
    document.getElementById('addProductForm')?.addEventListener('submit', handleAddProduct);
    document.getElementById('productImages')?.addEventListener('change', handleImageSelect);
    
    // Busca e Filtros
    document.getElementById('searchInput')?.addEventListener('input', debounce(handleSearch, 500));
    document.getElementById('globalCurrency')?.addEventListener('change', handleCurrencyChange);
    document.getElementById('sortFilter')?.addEventListener('change', handleSortChange);
    
    // Categorias
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => handleCategoryChange(card.dataset.category));
    });
    
    // Fechar modais
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAllModals();
        });
    });
    
    // Fechar dropdown ao clicar fora
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('userDropdown');
        const userBtn = document.getElementById('userMenuBtn');
        if (dropdown && !dropdown.contains(e.target) && !userBtn?.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

// Autenticação
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        if (!supabase) {
            showNotification('⚠️ Configure o Supabase em config.js', 'warning');
            // Modo demo
            currentUser = {
                id: 'demo-user',
                email: email,
                name: email.split('@')[0]
            };
            updateUIForLoggedInUser();
            closeAllModals();
            showNotification('✅ Login realizado (modo demo)', 'success');
            return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        await loadUserData(data.user.id);
        updateUIForLoggedInUser();
        closeAllModals();
        showNotification('✅ Login realizado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro no login:', error);
        showNotification('❌ Erro ao fazer login: ' + error.message, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('registerPhone').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (password !== confirmPassword) {
        showNotification('❌ As senhas não coincidem', 'error');
        return;
    }
    
    try {
        if (!supabase) {
            showNotification('⚠️ Configure o Supabase em config.js', 'warning');
            // Modo demo
            currentUser = {
                id: 'demo-user',
                email: email,
                name: name,
                phone: phone
            };
            updateUIForLoggedInUser();
            closeAllModals();
            showNotification('✅ Conta criada (modo demo)', 'success');
            return;
        }

        // Criar usuário no Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password
        });
        
        if (authError) throw authError;
        
        // Criar perfil do usuário
        const { error: profileError } = await supabase
            .from('users')
            .insert([
                { 
                    id: authData.user.id,
                    email: email,
                    name: name,
                    phone: phone
                }
            ]);
        
        if (profileError) throw profileError;
        
        currentUser = {
            id: authData.user.id,
            email: email,
            name: name,
            phone: phone
        };
        
        updateUIForLoggedInUser();
        closeAllModals();
        showNotification('✅ Conta criada com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro no registro:', error);
        showNotification('❌ Erro ao criar conta: ' + error.message, 'error');
    }
}

async function checkUserSession() {
    if (!supabase) return;
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            await loadUserData(session.user.id);
            updateUIForLoggedInUser();
        }
    } catch (error) {
        console.error('Erro ao verificar sessão:', error);
    }
}

async function loadUserData(userId) {
    if (!supabase) return;
    
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        
        currentUser = data;
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }
}

async function logout() {
    if (supabase) {
        await supabase.auth.signOut();
    }
    
    currentUser = null;
    updateUIForLoggedOutUser();
    showNotification('👋 Logout realizado com sucesso', 'success');
}

function updateUIForLoggedInUser() {
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('userMenuBtn').style.display = 'flex';
    
    const initials = currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('userInitials').textContent = initials;
    document.getElementById('userInitialsLarge').textContent = initials;
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userEmail').textContent = currentUser.email;
}

function updateUIForLoggedOutUser() {
    document.getElementById('loginBtn').style.display = 'flex';
    document.getElementById('userMenuBtn').style.display = 'none';
    document.getElementById('userDropdown').style.display = 'none';
}

// Produtos
async function loadProducts() {
    const grid = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');
    
    try {
        if (!supabase) {
            // Produtos demo
            allProducts = generateDemoProducts();
        } else {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    users (name),
                    reviews (rating)
                `)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            allProducts = data;
        }
        
        filterAndDisplayProducts();
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        grid.innerHTML = '<p class="text-center" style="padding: 40px;">Erro ao carregar produtos</p>';
    }
}

function filterAndDisplayProducts() {
    let filtered = [...allProducts];
    
    // Filtrar por categoria
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }
    
    // Filtrar por busca
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(searchTerm) ||
            p.description?.toLowerCase().includes(searchTerm)
        );
    }
    
    // Ordenar
    filtered = sortProducts(filtered, currentSort);
    
    displayProducts(filtered);
}

function sortProducts(products, sortBy) {
    switch (sortBy) {
        case 'recent':
            return products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        case 'price-low':
            return products.sort((a, b) => convertToMZN(a.price, a.currency) - convertToMZN(b.price, b.currency));
        case 'price-high':
            return products.sort((a, b) => convertToMZN(b.price, b.currency) - convertToMZN(a.price, a.currency));
        case 'rating':
            return products.sort((a, b) => {
                const ratingA = calculateAverageRating(a.reviews || []);
                const ratingB = calculateAverageRating(b.reviews || []);
                return ratingB - ratingA;
            });
        default:
            return products;
    }
}

function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (products.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    grid.innerHTML = products.map((product, index) => {
        const convertedPrice = convertPrice(product.price, product.currency, currentCurrency);
        const rating = calculateAverageRating(product.reviews || []);
        
        return `
            <div class="product-card" style="animation-delay: ${index * 0.05}s" onclick="showProductDetail('${product.id}')">
                <img src="${product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/300x220?text=Sem+Imagem'}" 
                     alt="${product.title}" 
                     class="product-image"
                     onerror="this.src='https://via.placeholder.com/300x220?text=Sem+Imagem'">
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <div class="product-price">${formatPrice(convertedPrice, currentCurrency)}</div>
                    <div class="product-meta">
                        <span class="product-location">📍 ${product.location || 'Moçambique'}</span>
                        ${rating > 0 ? `
                            <span class="product-rating">
                                <span class="rating-stars">⭐</span>
                                ${rating.toFixed(1)}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function showProductDetail(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('productModal');
    const container = document.getElementById('productDetail');
    
    // Carregar reviews se existirem
    let reviews = product.reviews || [];
    if (supabase) {
        try {
            const { data } = await supabase
                .from('reviews')
                .select('*, users(name)')
                .eq('product_id', productId);
            if (data) reviews = data;
        } catch (error) {
            console.error('Erro ao carregar reviews:', error);
        }
    }
    
    const rating = calculateAverageRating(reviews);
    const convertedPrice = convertPrice(product.price, product.currency, currentCurrency);
    
    container.innerHTML = `
        <div class="product-detail-container">
            <div class="product-gallery">
                <img src="${product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/400?text=Sem+Imagem'}" 
                     alt="${product.title}" 
                     class="main-image" 
                     id="mainImage"
                     onerror="this.src='https://via.placeholder.com/400?text=Sem+Imagem'">
                ${product.images && product.images.length > 1 ? `
                    <div class="thumbnail-grid">
                        ${product.images.map((img, i) => `
                            <img src="${img}" 
                                 alt="Foto ${i + 1}" 
                                 class="thumbnail ${i === 0 ? 'active' : ''}"
                                 onclick="changeMainImage('${img}', this)"
                                 onerror="this.src='https://via.placeholder.com/80?text=${i+1}'">
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            
            <div class="product-details">
                <div class="product-header">
                    <h2>${product.title}</h2>
                    <div class="product-price-large">${formatPrice(convertedPrice, currentCurrency)}</div>
                    <span class="product-condition">${translateCondition(product.condition)}</span>
                </div>
                
                <div class="product-description">
                    <p>${product.description || 'Sem descrição disponível.'}</p>
                </div>
                
                <div class="product-info-grid">
                    <div class="info-item">
                        <span class="info-label">Categoria</span>
                        <span class="info-value">${CATEGORIES[product.category]?.name || product.category}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Localização</span>
                        <span class="info-value">${product.location || 'Moçambique'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Publicado</span>
                        <span class="info-value">${formatDate(product.created_at)}</span>
                    </div>
                </div>
                
                <div class="seller-info">
                    <h4>Vendedor</h4>
                    <div class="seller-rating">
                        <strong>${product.users?.name || 'Vendedor'}</strong>
                        ${rating > 0 ? `<span class="rating-stars">⭐ ${rating.toFixed(1)}</span>` : ''}
                    </div>
                    <div class="contact-buttons">
                        <button class="btn btn-primary btn-whatsapp" onclick="contactWhatsApp('${product.id}')">
                            💬 WhatsApp
                        </button>
                        <button class="btn btn-secondary" onclick="addToFavorites('${product.id}')">
                            ❤️ Favoritar
                        </button>
                    </div>
                </div>
                
                <div class="reviews-section">
                    <div class="reviews-header">
                        <h4>Avaliações (${reviews.length})</h4>
                        ${currentUser ? `
                            <button class="btn btn-secondary add-review-btn" onclick="showAddReviewForm('${product.id}')">
                                Avaliar
                            </button>
                        ` : ''}
                    </div>
                    <div id="reviewsList">
                        ${reviews.length > 0 ? reviews.map(review => `
                            <div class="review-card">
                                <div class="review-header">
                                    <div>
                                        <div class="reviewer-name">${review.users?.name || 'Usuário'}</div>
                                        <div class="review-date">${formatDate(review.created_at)}</div>
                                    </div>
                                    <div class="review-rating">${'⭐'.repeat(review.rating)}</div>
                                </div>
                                <p class="review-text">${review.comment || ''}</p>
                            </div>
                        `).join('') : '<p style="color: var(--text-light);">Nenhuma avaliação ainda.</p>'}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
}

function changeMainImage(src, thumbnail) {
    document.getElementById('mainImage').src = src;
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    thumbnail.classList.add('active');
}

async function handleAddProduct(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('⚠️ Faça login para adicionar produtos', 'warning');
        return;
    }
    
    const title = document.getElementById('productTitle').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const currency = document.getElementById('productCurrency').value;
    const category = document.getElementById('productCategory').value;
    const condition = document.getElementById('productCondition').value;
    const description = document.getElementById('productDescription').value;
    const location = document.getElementById('productLocation').value;
    
    try {
        let imageUrls = [];
        
        // Upload de imagens
        if (selectedImages.length > 0 && supabase) {
            for (const image of selectedImages) {
                const fileExt = image.name.split('.').pop();
                const fileName = `${currentUser.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                
                const { data, error } = await supabase.storage
                    .from('product-images')
                    .upload(fileName, image);
                
                if (error) throw error;
                
                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName);
                
                imageUrls.push(publicUrl);
            }
        } else if (selectedImages.length > 0) {
            // Modo demo - criar URLs placeholder
            imageUrls = selectedImages.map((_, i) => 
                `https://via.placeholder.com/400x300?text=Produto+Foto+${i+1}`
            );
        }
        
        const productData = {
            user_id: currentUser.id,
            title,
            price,
            currency,
            category,
            condition,
            description,
            location,
            images: imageUrls
        };
        
        if (supabase) {
            const { data, error } = await supabase
                .from('products')
                .insert([productData])
                .select();
            
            if (error) throw error;
        } else {
            // Modo demo
            productData.id = 'demo-' + Date.now();
            productData.created_at = new Date().toISOString();
            productData.users = { name: currentUser.name };
            allProducts.unshift(productData);
        }
        
        closeAllModals();
        showNotification('✅ Produto adicionado com sucesso!', 'success');
        document.getElementById('addProductForm').reset();
        selectedImages = [];
        document.getElementById('imagePreview').innerHTML = '';
        await loadProducts();
        
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        showNotification('❌ Erro ao adicionar produto: ' + error.message, 'error');
    }
}

function handleImageSelect(e) {
    const files = Array.from(e.target.files);
    
    if (files.length + selectedImages.length > 5) {
        showNotification('⚠️ Máximo de 5 imagens permitidas', 'warning');
        return;
    }
    
    files.forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
            showNotification('⚠️ Imagem muito grande (máx 5MB)', 'warning');
            return;
        }
        
        const currentIndex = selectedImages.length;
        selectedImages.push(file);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('imagePreview');
            const container = document.createElement('div');
            container.className = 'preview-image-container';
            container.innerHTML = `
                <img src="${e.target.result}" class="preview-image" alt="Preview">
                <button type="button" class="remove-image" onclick="removeImage(${currentIndex})">×</button>
            `;
            preview.appendChild(container);
        };
        reader.readAsDataURL(file);
    });
}

function removeImage(index) {
    selectedImages.splice(index, 1);
    const preview = document.getElementById('imagePreview');
    if (preview.children[index]) {
        preview.children[index].remove();
    }
}

// Utilitários
function convertPrice(price, fromCurrency, toCurrency) {
    const priceInMZN = price / EXCHANGE_RATES[fromCurrency];
    return priceInMZN * EXCHANGE_RATES[toCurrency];
}

function convertToMZN(price, fromCurrency) {
    return price / EXCHANGE_RATES[fromCurrency];
}

function formatPrice(price, currency) {
    const symbol = CURRENCY_SYMBOLS[currency];
    return `${symbol} ${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    
    return date.toLocaleDateString('pt-PT');
}

function calculateAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
}

function translateCondition(condition) {
    const translations = {
        new: 'Novo',
        used: 'Usado',
        refurbished: 'Recondicionado'
    };
    return translations[condition] || condition;
}

function contactWhatsApp(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const message = encodeURIComponent(
        `Olá! Tenho interesse no produto:\n\n` +
        `📦 ${product.title}\n` +
        `💰 ${formatPrice(product.price, product.currency)}\n\n` +
        `Está disponível?`
    );
    
    // Número padrão (você deve adicionar um campo 'phone' aos produtos no futuro)
    const phoneNumber = '258840000000'; // Substitua pelo número real do vendedor
    
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    showNotification('📱 Abrindo WhatsApp...', 'info');
}

async function addToFavorites(productId) {
    if (!currentUser) {
        showNotification('⚠️ Faça login para favoritar produtos', 'warning');
        showAuthModal();
        return;
    }
    
    try {
        if (supabase) {
            const { error } = await supabase
                .from('favorites')
                .insert([{
                    user_id: currentUser.id,
                    product_id: productId
                }]);
            
            if (error) {
                if (error.code === '23505') {
                    showNotification('ℹ️ Produto já está nos favoritos', 'info');
                } else {
                    throw error;
                }
            } else {
                showNotification('❤️ Adicionado aos favoritos!', 'success');
            }
        } else {
            showNotification('❤️ Adicionado aos favoritos! (modo demo)', 'success');
        }
    } catch (error) {
        console.error('Erro ao adicionar favorito:', error);
        showNotification('❌ Erro ao favoritar produto', 'error');
    }
}

function showAddReviewForm(productId) {
    const reviewsList = document.getElementById('reviewsList');
    
    const form = document.createElement('div');
    form.className = 'review-card';
    form.innerHTML = `
        <form onsubmit="submitReview(event, '${productId}')">
            <div class="form-group">
                <label>Avaliação</label>
                <div style="font-size: 24px; margin: 10px 0;">
                    ${[1, 2, 3, 4, 5].map(i => 
                        `<span onclick="setRating(${i})" style="cursor: pointer;" class="star" data-rating="${i}">☆</span>`
                    ).join('')}
                </div>
                <input type="hidden" id="reviewRating" required>
            </div>
            <div class="form-group">
                <label>Comentário (opcional)</label>
                <textarea id="reviewComment" rows="3" placeholder="Compartilhe sua experiência..."></textarea>
            </div>
            <div style="display: flex; gap: 10px;">
                <button type="submit" class="btn btn-primary">Enviar</button>
                <button type="button" class="btn btn-secondary" onclick="this.closest('.review-card').remove()">Cancelar</button>
            </div>
        </form>
    `;
    
    reviewsList.prepend(form);
}

function setRating(rating) {
    document.getElementById('reviewRating').value = rating;
    document.querySelectorAll('.star').forEach((star, index) => {
        star.textContent = index < rating ? '★' : '☆';
    });
}

async function submitReview(e, productId) {
    e.preventDefault();
    
    const rating = parseInt(document.getElementById('reviewRating').value);
    const comment = document.getElementById('reviewComment').value;
    
    if (!rating) {
        showNotification('⚠️ Selecione uma avaliação', 'warning');
        return;
    }
    
    try {
        if (supabase) {
            const { error } = await supabase
                .from('reviews')
                .insert([{
                    product_id: productId,
                    user_id: currentUser.id,
                    rating: rating,
                    comment: comment
                }]);
            
            if (error) throw error;
        }
        
        showNotification('✅ Avaliação enviada!', 'success');
        closeAllModals();
        setTimeout(() => showProductDetail(productId), 500);
        
    } catch (error) {
        console.error('Erro ao enviar avaliação:', error);
        showNotification('❌ Erro ao enviar avaliação', 'error');
    }
}

// Handlers
function handleSearch() {
    filterAndDisplayProducts();
}

function handleCurrencyChange(e) {
    currentCurrency = e.target.value;
    filterAndDisplayProducts();
}

function handleSortChange(e) {
    currentSort = e.target.value;
    filterAndDisplayProducts();
}

function handleCategoryChange(category) {
    currentCategory = category;
    
    document.querySelectorAll('.category-card').forEach(card => {
        card.classList.remove('active');
    });
    
    event.currentTarget.classList.add('active');
    
    filterAndDisplayProducts();
}

// UI Helpers
function showAuthModal() {
    document.getElementById('authModal').classList.add('show');
    showLoginForm();
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('authTitle').textContent = 'Bem-vindo de volta';
    document.getElementById('authSubtitle').textContent = 'Entre para acessar sua conta';
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('authTitle').textContent = 'Criar Conta';
    document.getElementById('authSubtitle').textContent = 'Junte-se ao MarketX hoje';
}

function showAddProductModal() {
    if (!currentUser) {
        showNotification('⚠️ Faça login para adicionar produtos', 'warning');
        showAuthModal();
        return;
    }
    
    document.getElementById('addProductModal').classList.add('show');
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
}

function showNotification(message, type = 'info') {
    const colors = {
        success: '#28A745',
        error: '#DC3545',
        warning: '#FFC107',
        info: '#17A2B8'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        font-weight: 600;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Produtos Demo
function generateDemoProducts() {
    return [
        {
            id: 'demo-1',
            title: 'iPhone 13 Pro Max 256GB',
            description: 'iPhone em excelente estado, pouco usado, com caixa e acessórios originais. Bateria com 95% de capacidade.',
            price: 55000,
            currency: 'MZN',
            category: 'electronics',
            condition: 'used',
            location: 'Maputo, Cidade',
            images: ['https://via.placeholder.com/400x300/4A90E2/FFFFFF?text=iPhone+13+Pro'],
            created_at: new Date(Date.now() - 86400000).toISOString(),
            users: { name: 'João Silva' },
            reviews: [{ rating: 5 }, { rating: 4 }]
        },
        {
            id: 'demo-2',
            title: 'Toyota Corolla 2018',
            description: 'Veículo em perfeito estado, único dono, todas as revisões em dia. Aceito troca por veículo de menor valor.',
            price: 1500000,
            currency: 'MZN',
            category: 'vehicles',
            condition: 'used',
            location: 'Matola',
            images: ['https://via.placeholder.com/400x300/E74C3C/FFFFFF?text=Toyota+Corolla'],
            created_at: new Date(Date.now() - 172800000).toISOString(),
            users: { name: 'Maria Costa' },
            reviews: [{ rating: 5 }]
        },
        {
            id: 'demo-3',
            title: 'Apartamento T3 - Polana',
            description: 'Apartamento moderno com 3 quartos, 2 banheiros, sala ampla, varanda com vista mar e 2 vagas de garagem.',
            price: 15000000,
            currency: 'MZN',
            category: 'property',
            condition: 'new',
            location: 'Polana, Maputo',
            images: ['https://via.placeholder.com/400x300/27AE60/FFFFFF?text=Apartamento+T3'],
            created_at: new Date(Date.now() - 259200000).toISOString(),
            users: { name: 'Pedro Santos' },
            reviews: []
        },
        {
            id: 'demo-4',
            title: 'MacBook Air M2 2023',
            description: 'Novo na caixa, nunca usado. 8GB RAM, 256GB SSD. Garantia Apple de 1 ano.',
            price: 75000,
            currency: 'MZN',
            category: 'electronics',
            condition: 'new',
            location: 'Maputo',
            images: ['https://via.placeholder.com/400x300/9B59B6/FFFFFF?text=MacBook+Air'],
            created_at: new Date(Date.now() - 345600000).toISOString(),
            users: { name: 'Ana Fernandes' },
            reviews: [{ rating: 5 }, { rating: 5 }, { rating: 4 }]
        },
        {
            id: 'demo-5',
            title: 'Sofá 3 Lugares Confortável',
            description: 'Sofá em excelente estado, muito confortável, cor cinza, tecido de alta qualidade.',
            price: 18000,
            currency: 'MZN',
            category: 'home',
            condition: 'used',
            location: 'Sommerschield',
            images: ['https://via.placeholder.com/400x300/F39C12/FFFFFF?text=Sofá+3+Lugares'],
            created_at: new Date(Date.now() - 432000000).toISOString(),
            users: { name: 'Carlos Machado' },
            reviews: [{ rating: 4 }]
        },
        {
            id: 'demo-6',
            title: 'PlayStation 5 + 2 Controles',
            description: 'PS5 em perfeito estado com 2 controles DualSense e 5 jogos (FIFA 24, Spider-Man, God of War, etc).',
            price: 45000,
            currency: 'MZN',
            category: 'toys',
            condition: 'used',
            location: 'Maputo',
            images: ['https://via.placeholder.com/400x300/3498DB/FFFFFF?text=PlayStation+5'],
            created_at: new Date(Date.now() - 518400000).toISOString(),
            users: { name: 'Ricardo Dias' },
            reviews: [{ rating: 5 }, { rating: 5 }]
        }
    ];
}

// Adicionar estilos de animação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
