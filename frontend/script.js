// API base for backend integration
const API_BASE_URL = 'http://localhost:8081';

const storedUserString = localStorage.getItem('currentUser');
let currentUser = storedUserString ? JSON.parse(storedUserString) : null;

function normalizeRole(role) {
    return (role || '').replace(/^ROLE_/i, '').toUpperCase();
}

if (currentUser && currentUser.role) {
    currentUser.role = normalizeRole(currentUser.role);
}

function isAdminUser(user) {
    return normalizeRole(user?.role) === 'ADMIN';
}

function showMessage(elementId, text, isError = true) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = text || '';
    el.style.display = text ? 'block' : 'none';
    el.className = isError ? 'message error' : 'message success';
}

function storeAuthHeader(email, password, remember) {
    const header = "Basic " + btoa(`${email}:${password}`);
    sessionStorage.setItem('authHeader', header);
    if (remember) {
        localStorage.setItem('authHeader', header);
    } else {
        localStorage.removeItem('authHeader');
    }
    return header;
}

function clearStoredAuth() {
    sessionStorage.removeItem('authHeader');
    localStorage.removeItem('authHeader');
}

function getStoredAuthHeader() {
    return sessionStorage.getItem('authHeader') || localStorage.getItem('authHeader') || '';
}

async function register(event) {
    if (event) event.preventDefault();

    if (!isAdminUser(currentUser)) {
        showMessage('registerMessage', 'Apenas administradores podem criar novos usuários.');
        return;
    }

    const name = document.getElementById('name')?.value?.trim();
    const email = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('password')?.value || '';
    const role = document.getElementById('role')?.value || '';

    if (!email || !password) {
        showMessage('registerMessage', 'E-mail e senha são obrigatórios.');
        return;
    }

    if (password.length < 8) {
        showMessage('registerMessage', 'A senha deve ter pelo menos 8 caracteres.');
        return;
    }

    if (!role) {
        showMessage('registerMessage', 'Selecione uma função.');
        return;
    }

    const userData = { name, email, password, role };

    try {
        const headers = { 'Content-Type': 'application/json' };

        const currentAuth = getStoredAuthHeader();
        if (currentAuth) {
            headers['Authorization'] = currentAuth;
        }

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers,
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Falha no registro');
        }

        showMessage('registerMessage', 'Usuário registrado com sucesso.', false);
        document.getElementById('registerForm')?.reset();

    } catch (error) {
        showMessage('registerMessage', 'Erro: ' + error.message);
    }
}

function getAuthToken() {
    return getStoredAuthHeader();
}

function getJsonHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = token;
    }
    return headers;
}

function getAuthHeaders() {
    // Tenta recuperar o token salvo no login (vamos criar a lógica de login a seguir)
    // O formato deve ser "Basic " + email:senha em Base64
    const storedAuth = getStoredAuthHeader();
    
    // NOTA: Se ainda não tens login feito, descomenta a linha abaixo para TESTAR com o teu admin:
    // Substitui pelo teu email e senha reais do backend
    // const storedAuth = 'Basic ' + btoa('teu_email@exemplo.com:tua_senha'); 

    return {
        'Content-Type': 'application/json',
        'Authorization': storedAuth || '' 
    };
}

async function login(event) {
    if (event) event.preventDefault(); // Impede o recarregamento da página
    showMessage('loginMessage', '');

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberMe = document.getElementById('rememberMe')?.checked;
    const email = emailInput?.value?.trim();
    const password = passwordInput?.value || '';

    if (!email || !password) {
        showMessage('loginMessage', 'E-mail e senha são obrigatórios.');
        return;
    }

    if (password.length < 8) {
        showMessage('loginMessage', 'A senha deve ter pelo menos 8 caracteres.');
        return;
    }

    const loginData = { email: email, password: password };

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });

        if (response.ok) {
            const user = await response.json();

            if (user.enabled === false) {
                showMessage('loginMessage', 'Conta desativada. Fale com um administrador.');
                return;
            }

            const normalizedRole = normalizeRole(user.role);
            const storedUser = { ...user, role: normalizedRole };

            currentUser = storedUser;
            localStorage.setItem('currentUser', JSON.stringify(storedUser));
            storeAuthHeader(email, password, rememberMe);

            showMessage('loginMessage', 'Login realizado com sucesso.', false);
            window.location.href = 'dashboard.html';

        } else {
            const errorText = await response.text();
            showMessage('loginMessage', errorText || 'E-mail ou senha incorretos. Tente novamente.');
        }

    } catch (error) {
        showMessage('loginMessage', 'Não foi possível conectar ao servidor. Verifique se o backend está no ar.');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    clearStoredAuth();
    window.location.href = 'index.html';
}

function buildBasicAuthHeader() {
    return getStoredAuthHeader();
}

// Product management (backed by API)
let products = [];
const ITEMS_PER_PAGE = 5;
let currentPage = 1;

function mapApiProductToUi(apiProduct) {
    const placeholderMain = getUnsplashImage(200, 200, apiProduct.category || 'music');
    const normalizedMain = normalizeImageUrl(apiProduct.mainImage);
    const placeholderFeatured = [
        getUnsplashImage(100, 100, apiProduct.category || 'music'),
        getUnsplashImage(100, 100, apiProduct.category || 'album')
    ];

    const detailsObject = (apiProduct.details || []).reduce((acc, detail) => {
        acc[detail.name] = detail.value;
        return acc;
    }, {});

    return {
        id: apiProduct.id,
        name: apiProduct.name,
        shortDescription: apiProduct.shortDescription,
        fullDescription: apiProduct.fullDescription,
        brand: apiProduct.brand,
        category: apiProduct.category,
        mainImage: normalizedMain || placeholderMain,
        featuredImages: apiProduct.featuredImages?.length ? apiProduct.featuredImages : placeholderFeatured,
        listPrice: apiProduct.listPrice ?? 0,
        discountPercent: apiProduct.discount ?? 0,
        enabled: apiProduct.isEnabled,
        inStock: apiProduct.inStock,
        length: apiProduct.dimension?.length ?? 0,
        width: apiProduct.dimension?.width ?? 0,
        height: apiProduct.dimension?.height ?? 0,
        weight: apiProduct.dimension?.weight ?? 0,
        cost: apiProduct.cost ?? 0,
        details: detailsObject,
        creationTime: apiProduct.creationTime,
        updateTime: apiProduct.updateTime
    };
}

function getProductDetails() {
    const detailsContainer = document.getElementById('productDetails');
    const detailInputs = detailsContainer.querySelectorAll('input');
    const details = {};
    for (let i = 0; i < detailInputs.length; i += 2) {
        const name = detailInputs[i].value;
        const value = detailInputs[i + 1].value;
        if (name && value) {
            details[name] = value;
        }
    }
    return details;
}

function getProductDetailsAsArray() {
    return Object.entries(getProductDetails()).map(([name, value]) => ({ name, value }));
}

function buildProductRequestFromForm(creationTimeOverride) {
    return {
        name: document.getElementById('name').value,
        shortDescription: document.getElementById('shortDescription').value,
        fullDescription: document.getElementById('fullDescription').value,
        brand: document.getElementById('brand').value,
        category: document.getElementById('category').value,
        listPrice: parseFloat(document.getElementById('listPrice').value),
        discount: parseFloat(document.getElementById('discountPercent').value) || 0,
        isEnabled: document.getElementById('enabled').checked,
        inStock: document.getElementById('inStock').checked,
        dimension: {
            length: parseFloat(document.getElementById('length').value),
            width: parseFloat(document.getElementById('width').value),
            height: parseFloat(document.getElementById('height').value),
            weight: parseFloat(document.getElementById('weight').value)
        },
        cost: parseFloat(document.getElementById('cost').value),
        details: getProductDetailsAsArray(),
        creationTime: creationTimeOverride ?? new Date().toISOString(),
        updateTime: new Date().toISOString()
    };
}

async function addProduct(event) {
    event.preventDefault();
    const request = buildProductRequestFromForm();

    try {
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || 'Failed to create product');
        }

        const createdProduct = await response.json();
        try {
            await uploadProductImage(createdProduct.id, 'mainImage');
        } catch (imageErr) {
            console.warn('Product created, but failed to upload image', imageErr);
        }

        alert('Product added successfully');
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error(error);
        alert('Error creating product. Please try again.');
    }
}

async function loadCategories() {
    const tableBody = document.getElementById('categoryList');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="7">Carregando...</td></tr>';

    try {
        // ADICIONADO: O segundo parâmetro com headers
        const response = await fetch(`${API_BASE_URL}/api/categories`, {
            method: 'GET',
            headers: getJsonHeaders() // Usa o helper padronizado
        });

        if (response.status === 401 || response.status === 403) {
             throw new Error('Não autorizado! Verifica o login.');
        }

        if (!response.ok) {
            throw new Error('Falha ao carregar categorias');
        }

        const data = await response.json();
        const categories = Array.isArray(data) ? data : (data.content || []);

        const statusMap = getCategoryStatusFromStorage();

        allCategories = categories.map(cat => ({
            ...cat,
            enabled: statusMap[cat.id] !== false ? (cat.enabled ?? true) : false
        }));

        currentCategoryPage = 1;
        displayCategories();

    } catch (error) {
        console.error(error);
        tableBody.innerHTML = '<tr><td colspan="7" style="color:red">Erro ao carregar categorias (401/403).</td></tr>';
    }
}

async function fetchProductById(id) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        headers: getJsonHeaders() // <--- Necessário se o GET for protegido
    });
    if (!response.ok) {
        throw new Error('Product not found');
    }
    const product = await response.json();
    return mapApiProductToUi(product);
}

function displayProducts() {
    const productList = document.getElementById('productList');
    if (!productList) {
        return;
    }
    productList.innerHTML = '';

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedProducts = products.slice(startIndex, endIndex);

    paginatedProducts.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td><img src="${product.mainImage}" alt="${product.name}" width="50" onerror="this.src='https://via.placeholder.com/50'"></td>
            <td>${product.name}</td>
            <td>${product.brand}</td>
            <td>${product.category}</td>
            <td>
                <button onclick="viewProduct(${product.id})">View</button>
                <button onclick="editProduct(${product.id})">Edit</button>
                <button onclick="deleteProduct(${product.id})">Delete</button>
            </td>
        `;
        productList.appendChild(row);
    });

    displayPagination();
}

function displayPagination() {
    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) {
        return;
    }
    paginationContainer.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.onclick = () => {
            currentPage = i;
            displayProducts();
        };
        paginationContainer.appendChild(button);
    }
}

function viewProduct(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        window.location.href = `view-product.html?id=${id}`;
    }
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        window.location.href = `edit-product.html?id=${id}`;
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': buildBasicAuthHeader(),
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 204) {
            alert('Product deleted successfully!');
            await loadProductsFromApi();
            return;
        }

        if (response.status === 403) {
            alert('⛔ Error: You do not have permission to delete products (Admin/Editor only).');
            return;
        }

        if (response.status === 404) {
            alert('Error: Product not found.');
            products = products.filter(p => p.id !== id);
            displayProducts();
            return;
        }

        const text = await response.text();
        throw new Error(text || 'Failed to delete product');
    } catch (error) {
        console.error(error);
        alert('Error deleting product: ' + error.message);
    }
}

async function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));

    try {
        const product = await fetchProductById(productId);
        const detailsContainer = document.getElementById('productDetails');
        detailsContainer.innerHTML = `
            <h3>${product.name}</h3>
            <img src="${product.mainImage}" alt="${product.name}" width="200" onerror="this.src='https://via.placeholder.com/200'">
            <p><strong>Brand:</strong> ${product.brand}</p>
            <p><strong>Category:</strong> ${product.category}</p>
            <p><strong>Short Description:</strong> ${product.shortDescription}</p>
            <p><strong>Full Description:</strong> ${product.fullDescription}</p>
            <p><strong>List Price:</strong> $${Number(product.listPrice).toFixed(2)}</p>
            <p><strong>Discount:</strong> ${product.discountPercent}%</p>
            <p><strong>Enabled:</strong> ${product.enabled ? 'Yes' : 'No'}</p>
            <p><strong>In Stock:</strong> ${product.inStock ? 'Yes' : 'No'}</p>
            <p><strong>Dimensions:</strong> ${product.length}" x ${product.width}" x ${product.height}"</p>
            <p><strong>Weight:</strong> ${product.weight} lbs</p>
            <p><strong>Cost:</strong> $${Number(product.cost).toFixed(2)}</p>
            <p><strong>Creation Time:</strong> ${new Date(product.creationTime).toLocaleString()}</p>
            <p><strong>Update Time:</strong> ${new Date(product.updateTime).toLocaleString()}</p>
            <h4>Product Details:</h4>
            <ul>
                ${Object.entries(product.details).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}
            </ul>
            <h4>Featured Images:</h4>
            ${product.featuredImages.map(img => `<img src="${img}" alt="Featured Image" width="100" onerror="this.src='https://via.placeholder.com/100'">`).join('')}
        `;
    } catch (error) {
        console.error(error);
        alert('Product not found');
        window.location.href = 'dashboard.html';
    }
}

async function loadEditForm() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));

    try {
        const product = await fetchProductById(productId);
        document.getElementById('productId').value = product.id;
        document.getElementById('name').value = product.name;
        document.getElementById('shortDescription').value = product.shortDescription;
        document.getElementById('fullDescription').value = product.fullDescription;
        document.getElementById('brand').value = product.brand;
        document.getElementById('category').value = product.category;
        document.getElementById('currentMainImage').innerHTML = `<img src="${product.mainImage}" alt="Current Main Image" width="100">`;
        document.getElementById('currentFeaturedImages').innerHTML = product.featuredImages.map(img => `<img src="${img}" alt="Featured Image" width="50">`).join('');
        document.getElementById('listPrice').value = product.listPrice;
        document.getElementById('discountPercent').value = product.discountPercent;
        document.getElementById('enabled').checked = product.enabled;
        document.getElementById('inStock').checked = product.inStock;
        document.getElementById('length').value = product.length;
        document.getElementById('width').value = product.width;
        document.getElementById('height').value = product.height;
        document.getElementById('weight').value = product.weight;
        document.getElementById('cost').value = product.cost;

        const detailsContainer = document.getElementById('productDetails');
        detailsContainer.innerHTML = '';
        Object.entries(product.details).forEach(([key, value]) => {
            const detailDiv = document.createElement('div');
            detailDiv.innerHTML = `
                <input type="text" value="${key}" placeholder="Detail Name">
                <input type="text" value="${value}" placeholder="Detail Value">
                <button type="button" onclick="removeDetail(this)">Remove</button>
            `;
            detailsContainer.appendChild(detailDiv);
        });

        // preserve creation time for update payload
        const creationTimeField = document.getElementById('creationTime');
        if (creationTimeField) {
            creationTimeField.value = product.creationTime;
        } else {
            const hiddenCreationInput = document.createElement('input');
            hiddenCreationInput.type = 'hidden';
            hiddenCreationInput.id = 'creationTime';
            hiddenCreationInput.value = product.creationTime;
            document.getElementById('editProductForm').appendChild(hiddenCreationInput);
        }
    } catch (error) {
        console.error(error);
        alert('Product not found');
        window.location.href = 'dashboard.html';
    }
}

function updateProduct(event) {
    event.preventDefault();
    const productId = parseInt(document.getElementById('productId').value);

    const creationTimeValue = document.getElementById('creationTime')?.value;
    const request = buildProductRequestFromForm(creationTimeValue);

    fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update product');
            }
            return response.json();
        })
        .then(async updated => {
            try {
                await uploadProductImage(productId, 'mainImage');
            } catch (imageErr) {
                console.warn('Product updated, but failed to upload image', imageErr);
            }
            alert('Product updated successfully');
            window.location.href = 'dashboard.html';
        })
        .catch(error => {
            console.error(error);
            alert('Error updating product. Please try again.');
        });
}

function removeDetail(button) {
    button.parentElement.remove();
}

function addDetailField() {
    const detailsContainer = document.getElementById('productDetails');
    const detailDiv = document.createElement('div');
    detailDiv.innerHTML = `
        <input type="text" placeholder="Detail Name">
        <input type="text" placeholder="Detail Value">
        <button type="button" onclick="removeDetail(this)">Remove</button>
    `;
    detailsContainer.appendChild(detailDiv);
}

function sortProducts() {
    const sortBy = document.getElementById('sortSelect').value;
    products.sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return -1;
        if (a[sortBy] > b[sortBy]) return 1;
        return 0;
    });
    displayProducts();
}

function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredProducts = products.filter(product =>
        (product.name || '').toLowerCase().includes(searchTerm) ||
        (product.shortDescription || '').toLowerCase().includes(searchTerm) ||
        (product.fullDescription || '').toLowerCase().includes(searchTerm) ||
        (product.brand || '').toLowerCase().includes(searchTerm) ||
        (product.category || '').toLowerCase().includes(searchTerm)
    );
    displayFilteredProducts(filteredProducts);
}

function displayFilteredProducts(filteredProducts) {
    const productList = document.getElementById('productList');
    if (!productList) {
        return;
    }
    productList.innerHTML = '';

    filteredProducts.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td><img src="${product.mainImage}" alt="${product.name}" width="50"></td>
            <td>${product.name}</td>
            <td>${product.brand}</td>
            <td>${product.category}</td>
            <td>
                <button onclick="viewProduct(${product.id})">View</button>
                <button onclick="editProduct(${product.id})">Edit</button>
                <button onclick="deleteProduct(${product.id})">Delete</button>
            </td>
        `;
        productList.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const normalizedRole = normalizeRole(currentUser?.role);

    // LOGIN
    if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
        if (currentUser) {
            window.location.href = 'dashboard.html';
            return;
        }

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', login);
        }
        return;
    }

    // REGISTRO
    if (path.includes('register.html')) {
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', register);
        }
        return;
    }

    // A partir daqui, todas as rotas requerem utilizador autenticado
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // DASHBOARD
    if (path.includes('dashboard.html')) {
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.textContent = `Bem-vindo, ${currentUser.name || ''} (${normalizedRole || 'USUÁRIO'})`;
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.addEventListener('click', logout);

        const categoriesBtn = document.getElementById('categoriesBtn');
        if (categoriesBtn) {
            categoriesBtn.addEventListener('click', () => window.location.href = 'categories.html');
        }

        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => window.location.href = 'add-product.html');
        }

        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            if (isAdminUser(currentUser)) {
                addUserBtn.style.display = 'inline-block';
                addUserBtn.addEventListener('click', () => window.location.href = 'register.html');
            } else {
                addUserBtn.style.display = 'none';
            }
        }

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', searchProducts);
        }

        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                sortProducts();
                searchProducts();
            });
        }

        initializeProducts();
        displayProducts();
        return;
    }

    // ADICIONAR PRODUTO
    if (path.includes('add-product.html')) {
        if (!['ADMIN', 'EDITOR'].includes(normalizedRole)) {
            window.location.href = 'index.html';
            return;
        }
        const addProductForm = document.getElementById('addProductForm');
        if (addProductForm) addProductForm.addEventListener('submit', addProduct);

        const addDetailBtn = document.getElementById('addDetailBtn');
        if (addDetailBtn) addDetailBtn.addEventListener('click', addDetailField);
        return;
    }

    // EDITAR PRODUTO
    if (path.includes('edit-product.html')) {
        if (!['ADMIN', 'EDITOR', 'SALESPERSON', 'GERENTE_VENDAS'].includes(normalizedRole)) {
            window.location.href = 'dashboard.html';
            return;
        }
        loadEditForm();

        const editProductForm = document.getElementById('editProductForm');
        if (editProductForm) editProductForm.addEventListener('submit', updateProduct);

        const addDetailBtn = document.getElementById('addDetailBtn');
        if (addDetailBtn) addDetailBtn.addEventListener('click', addDetailField);
        return;
    }

    // VER PRODUTO
    if (path.includes('view-product.html')) {
        loadProductDetails();
        return;
    }

    // CATEGORIAS
    if (path.includes('categories.html')) {
        const userInfoElement = document.getElementById('userInfo');
        if (userInfoElement) {
            userInfoElement.textContent = `Welcome, ${currentUser.name} (${normalizedRole})`;
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.addEventListener('click', logout);

        initializeCategoryStatusSystem();

        const categoryForm = document.getElementById('categoryForm');
        if (categoryForm) categoryForm.addEventListener('submit', createCategory);

        const showOnlyEnabledCheckbox = document.getElementById('showOnlyEnabled');
        const showSubcategoriesCheckbox = document.getElementById('showSubcategories');
        const searchBox = document.getElementById('searchInput');
        const sortSelect = document.getElementById('sortBy');

        if (showOnlyEnabledCheckbox) showOnlyEnabledCheckbox.addEventListener('change', filterAndRender);
        if (showSubcategoriesCheckbox) showSubcategoriesCheckbox.addEventListener('change', filterAndRender);
        if (searchBox) searchBox.addEventListener('input', filterAndRender);
        if (sortSelect) sortSelect.addEventListener('change', filterAndRender);

        if (normalizedRole !== 'ADMIN') {
            const formSection = document.querySelector('.form-container');
            if (formSection) formSection.style.display = 'none';
        }

        loadCategories();
        return;
    }

    // Inicialização padrão caso nenhuma rota anterior dê return
    try {
        initializeProducts();
    } catch (error) {
        console.error("Aviso: Falha ao inicializar produtos. Verifique a API.", error);
    }
});


// const PRODUCT_DATA_VERSION = 1; // Increment this when you update the initial product list

function initializeProducts() {
    loadProductsFromApi();
}

// Admin function to reset products
function resetProductsToInitial() {
    if (confirm("Are you sure you want to reset the product list to its initial state? This will delete any custom products.")) {
        loadProductsFromApi();
    }
}

function getUnsplashImage(width, height, category) {
    return `https://source.unsplash.com/random/${width}x${height}?${category}`;
}

// --- CATEGORY MANAGEMENT ---
function normalizeImageUrl(url) {
    // ! Se a URL for nula, vazia ou inválida, retorna a imagem cinza.
    if (!url || url.trim() === '' || url.trim() === 'null') {
        // Data URL para um quadrado cinza (sem precisar de arquivo extra)
        return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23cccccc"/></svg>';
    }

    // Se for imagem da internet, retorna igual
    if (url.startsWith('http://') || url.startsWith('https://')) return url;

    let finalUrl = url;

    // Garante que a URL tem a extensão correta (mantendo o ajuste anterior)
    if (!finalUrl.match(/\.(jpeg|jpg|gif|png)$/i)) { // Adicionado /i para case-insensitive
        finalUrl += '.png';
    }

    // Adiciona a base da API para formar a URL completa (ex: /user-images/...)
    const trimmed = finalUrl.startsWith('/') ? finalUrl : `/${finalUrl}`;

    return `${API_BASE_URL}${trimmed}`;
}
function resolveCategoryImage(cat) {
    const raw = cat.imageUrl || cat.image || cat.imagePath || cat.photo;
    return normalizeImageUrl(raw) || getUnsplashImage(80, 80, cat.name || 'music');
}

async function uploadProductImage(productId, inputId) {
    const input = document.getElementById(inputId);
    const file = input?.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const resp = await fetch(`${API_BASE_URL}/products/${productId}/image`, {
        method: 'POST',
        body: formData
    });
    if (!resp.ok) {
        const message = await resp.text();
        throw new Error(message || 'Image upload failed');
    }
    return resp.json();
}

const CATEGORIES_PER_PAGE = 10;
let currentCategoryPage = 1;
let allCategories = [];
let filteredCategories = [];

function getCategoryStatusFromStorage() {
    return JSON.parse(localStorage.getItem('categoryStatus')) || {};
}

function getCategoryDataFromTable() {
    const table = document.querySelector('table');

    if (!table) {
        console.error("Tabela de categorias não encontrada.");
        return {};
    }

    const rows = table.querySelectorAll('tbody tr');
    let categoryStatuses = {};

    // Mapeamento: 0=ID, 2=Name, 3=Description, 4=Parent ID, 5=Status
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');

        if (cells.length >= 6) {
            const id = cells[0].textContent.trim();
            const name = cells[2].textContent.trim();
            const description = cells[3].textContent.trim();
            const parentId = cells[4].textContent.trim();
            const statusText = cells[5].textContent.trim();

            if (id) {
                categoryStatuses[id] = {
                    name: name,
                    description: description,
                    parentId: parentId,
                    // Converte o texto de status para booleano (depende do texto na sua tabela)
                    enabled: statusText.toLowerCase() === 'enabled' || statusText.toLowerCase() === 'sim',
                };
            }
        }
    });

    return categoryStatuses;
}

function userIsAdmin() {
    return isAdminUser(currentUser);
}

function saveCategoryStatusToStorage(statusMap) {
    localStorage.setItem('categoryStatus', JSON.stringify(statusMap));
}

function toggleCategoryStatusInStorage(id) {
    const statusMap = getCategoryStatusFromStorage();
    const currentStatus = statusMap[id] !== false;
    statusMap[id] = !currentStatus;
    saveCategoryStatusToStorage(statusMap);
    return statusMap[id];
}

function getCategoryStatus(id) {
    const statusMap = getCategoryStatusFromStorage();
    return statusMap[id] !== false;
}

function setCategoryStatus(id, enabled) {
    const statusMap = getCategoryStatusFromStorage();
    statusMap[id] = enabled;
    saveCategoryStatusToStorage(statusMap);
}

function initializeCategoryStatusSystem() {
    if (!localStorage.getItem('categoryStatus')) {
        localStorage.setItem('categoryStatus', JSON.stringify({}));
    }
}

async function createCategory(event) {
    event.preventDefault();
    if (!userIsAdmin()) {
        alert('Apenas admin pode criar categorias.');
        return;
    }
    const name = document.getElementById('categoryName').value;
    const description = document.getElementById('categoryDescription').value;
    const parentCategoryIdRaw = document.getElementById('parentCategoryId').value;
    const parentCategoryId = parentCategoryIdRaw ? parseInt(parentCategoryIdRaw) : null;
    const enabled = document.getElementById('categoryEnabled')?.checked ?? true;
    const statusDiv = document.getElementById('categoryStatus');

    statusDiv.textContent = 'Enviando...';

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    if (parentCategoryId) formData.append('parentCategoryId', parentCategoryId);
    formData.append('enabled', enabled);

    const imageFile = document.getElementById('categoryImage')?.files?.[0];
    if (imageFile) {
        formData.append('imageFile', imageFile);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/categories`, {
            method: 'POST',
            headers: { 'Authorization': buildBasicAuthHeader() },
            body: formData
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || 'Erro ao criar categoria');
        }

        const createdCategory = await response.json();

        setCategoryStatus(createdCategory.id, enabled);

        const newCategory = {
            ...createdCategory,
            enabled: enabled
        };
        allCategories.push(newCategory);

        statusDiv.textContent = 'Categoria criada com sucesso.';
        statusDiv.style.color = 'green';

        document.getElementById('categoryForm').reset();

        currentCategoryPage = 1;
        displayCategories();

        setTimeout(() => { statusDiv.textContent = ''; }, 3000);

    } catch (error) {
        console.error(error);
        statusDiv.textContent = 'Falha ao criar: ' + error.message;
        statusDiv.style.color = 'red';
    }
}

async function loadCategories() {
    const tableBody = document.getElementById('categoryList');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="7">Carregando...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);

        if (!response.ok) {
            throw new Error('Falha ao carregar categorias');
        }

        const data = await response.json();
        const categories = Array.isArray(data) ? data : (data.content || []);

        const statusMap = getCategoryStatusFromStorage();

        allCategories = categories.map(cat => ({
            ...cat,
            enabled: statusMap[cat.id] !== false ? (cat.enabled ?? true) : false
        }));

        currentCategoryPage = 1;
        displayCategories();

    } catch (error) {
        console.error(error);
        tableBody.innerHTML = '<tr><td colspan="7" style="color:red">Erro ao carregar categorias.</td></tr>';
    }
}

async function deleteCategory(id) {
    if (!confirm(`Tem certeza que deseja excluir a categoria ID ${id}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': buildBasicAuthHeader()
            }
        });

        if (response.status === 204) {
            alert('Categoria excluída com sucesso!');
            allCategories = allCategories.filter(cat => cat.id !== id);
            loadCategories();
        } else if (response.status === 409) {
            alert('❌ ERRO: Não é possível excluir pois existem produtos nesta categoria.');
        } else if (response.status === 403) {
            alert('⛔ ERRO: Credenciais inválidas ou sem permissão.');
        } else if (response.status === 404) {
            alert('Erro: Categoria não encontrada no sistema.');
            allCategories = allCategories.filter(cat => cat.id !== id);
            loadCategories();
        } else {
            const text = await response.text();
            alert('Ocorreu um erro: ' + text);
        }

    } catch (error) {
        console.error("Erro na requisição:", error);
        alert('Erro de conexão com o servidor.');
    }
}

function userCanDelete() {
    if (!currentUser || !currentUser.role) return false;
    const role = normalizeRole(currentUser.role);
    return role === 'ADMIN' || role === 'EDITOR';
}

function toggleCategoryStatus(id) {
    const newStatus = toggleCategoryStatusInStorage(id);
    const category = allCategories.find(cat => cat.id === id);
    if (category) {
        category.enabled = newStatus;
    }
    displayCategories();
    alert(`Categoria ${newStatus ? 'habilitada' : 'desabilitada'} com sucesso!`);
}

function updateBreadcrumb() {
    const breadcrumbDiv = document.getElementById('breadcrumb');
    if (!breadcrumbDiv) return;
    breadcrumbDiv.innerHTML = `<span id="breadcrumbPath"><a href="#">Início</a></span>`;
}

function filterCategories(categories) {
    const showOnlyEnabled = document.getElementById('showOnlyEnabled')?.checked || false;
    const showSubcategories = document.getElementById('showSubcategories')?.checked || false;
    const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const sortBy = document.getElementById('sortBy')?.value || 'name_asc';

    let filtered = [...categories];

    if (showOnlyEnabled) {
        filtered = filtered.filter(cat => cat.enabled !== false);
    }

    if (!showSubcategories) {
        filtered = filtered.filter(cat => !cat.parentCategoryId);
    }

    if (searchTerm) {
        filtered = filtered.filter(cat => {
            const name = (cat.name || '').toLowerCase();
            const description = (cat.description || '').toLowerCase();
            return name.includes(searchTerm) || description.includes(searchTerm);
        });
    }

    filtered.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        const idA = a.id || 0;
        const idB = b.id || 0;

        switch (sortBy) {
            case 'name_desc':
                return nameB.localeCompare(nameA);
            case 'id_asc':
                return idA - idB;
            case 'id_desc':
                return idB - idA;
            case 'name_asc':
            default:
                return nameA.localeCompare(nameB);
        }
    });

    return filtered;
}

function organizeCategoriesHierarchically(categories) {
    const categoryMap = new Map();
    const rootCategories = [];

    categories.forEach(cat => {
        categoryMap.set(cat.id, {
            ...cat,
            subcategories: []
        });
    });

    categories.forEach(cat => {
        const categoryObj = categoryMap.get(cat.id);

        if (cat.parentCategoryId && categoryMap.has(cat.parentCategoryId)) {
            const parent = categoryMap.get(cat.parentCategoryId);
            parent.subcategories.push(categoryObj);
        } else {
            rootCategories.push(categoryObj);
        }
    });

    return rootCategories;
}

function flattenCategoriesForDisplay(hierarchicalCategories, onlyEnabled = true) {
    const flattened = [];

    function addCategory(cat, level = 0) {
        if (onlyEnabled && cat.enabled === false) {
            return;
        }

        flattened.push({
            ...cat,
            level: level
        });

        if (cat.subcategories && cat.subcategories.length > 0) {
            cat.subcategories.forEach(subcat => addCategory(subcat, level + 1));
        }
    }

    hierarchicalCategories.forEach(cat => addCategory(cat, 0));

    return flattened;
}

function displayCategories() {
    const tableBody = document.getElementById('categoryList');
    if (!tableBody) return;

    filteredCategories = filterCategories(allCategories);

    const hierarchicalCategories = organizeCategoriesHierarchically(filteredCategories);
    const displayCategoriesList = flattenCategoriesForDisplay(
        hierarchicalCategories,
        document.getElementById('showOnlyEnabled')?.checked || false
    );

    const totalPages = Math.ceil(displayCategoriesList.length / CATEGORIES_PER_PAGE);
    const startIndex = (currentCategoryPage - 1) * CATEGORIES_PER_PAGE;
    const endIndex = startIndex + CATEGORIES_PER_PAGE;
    const paginatedCategories = displayCategoriesList.slice(startIndex, endIndex);

    tableBody.innerHTML = '';

    if (paginatedCategories.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7">Nenhuma categoria encontrada.</td></tr>';
        displayCategoryPagination(totalPages);
        updateStatusSummary();
        return;
    }

    const canDelete = userCanDelete();

    paginatedCategories.forEach(cat => {
        const tr = document.createElement('tr');

        const parentCategory = allCategories.find(c => c.id === cat.parentCategoryId);
        const parentName = parentCategory ? parentCategory.name : '-';
        const imageUrl = resolveCategoryImage(cat);

        let htmlContent = `
            <td>${cat.id ?? ''}</td>
            <td><img class="category-thumb" src="${imageUrl}" alt="${cat.name ?? ''}" onerror="this.src='https://via.placeholder.com/80'"></td>
            <td style="padding-left: ${cat.level * 20}px">
                ${cat.level > 0 ? '├─ ' : ''}${cat.name ?? ''}
            </td>
            <td>${cat.description ?? '-'}</td>
            <td>${parentName}</td>
            <td>
                <span style="color: ${cat.enabled !== false ? 'green' : 'red'}; font-weight: bold;">
                    ${cat.enabled !== false ? '✓ Habilitada' : '✗ Desabilitada'}
                </span>
            </td>
            <td>
        `;

        htmlContent += `
            <button onclick="window.location.href='edit-category.html?id=${cat.id}'">Editar</button>
        `;

        if (canDelete) {
            htmlContent += `
                <button onclick="deleteCategory(${cat.id})" 
                        style="background-color: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin: 4px 2px;">
                    Excluir
                </button>
                <button onclick="toggleCategoryStatus(${cat.id})"
                        style="background-color: ${cat.enabled !== false ? '#ffc107' : '#28a745'}; color: ${cat.enabled !== false ? '#000' : 'white'}; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin: 4px 2px;">
                    ${cat.enabled !== false ? 'Desabilitar' : 'Habilitar'}
                </button>
            `;
        } else {
            htmlContent += `<span style="color: gray; font-size: 0.9em;">🔒 Restrito</span>`;
        }

        htmlContent += `</td>`;

        tr.innerHTML = htmlContent;
        tableBody.appendChild(tr);
    });

    displayCategoryPagination(totalPages);
    updateStatusSummary();
}

function filterAndRender() {
    currentCategoryPage = 1;
    displayCategories();
}

function displayCategoryPagination(totalPages) {
    const paginationContainer = document.getElementById('categoriesPagination') || document.getElementById('pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    if (currentCategoryPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = '← Anterior';
        prevButton.onclick = () => {
            currentCategoryPage--;
            displayCategories();
        };
        paginationContainer.appendChild(prevButton);
    }

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentCategoryPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.onclick = () => {
            currentCategoryPage = i;
            displayCategories();
        };

        if (i === currentCategoryPage) {
            button.style.fontWeight = 'bold';
            button.style.backgroundColor = '#007bff';
            button.style.color = 'white';
        }

        paginationContainer.appendChild(button);
    }

    if (currentCategoryPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Próxima →';
        nextButton.onclick = () => {
            currentCategoryPage++;
            displayCategories();
        };
        paginationContainer.appendChild(nextButton);
    }

    const infoSpan = document.createElement('span');
    infoSpan.textContent = ` Página ${currentCategoryPage} de ${totalPages}`;
    infoSpan.style.marginLeft = '10px';
    infoSpan.style.alignSelf = 'center';
    paginationContainer.appendChild(infoSpan);
}

function updateStatusSummary() {
    const summaryDiv = document.getElementById('statusSummary');
    if (!summaryDiv) return;

    const totalCategories = allCategories.length;
    const enabledCategories = allCategories.filter(cat => cat.enabled !== false).length;
    const disabledCategories = totalCategories - enabledCategories;

    summaryDiv.innerHTML = `
        <strong>Resumo:</strong> 
        Total: ${totalCategories} categorias | 
        Habilitadas: <span style="color: green">${enabledCategories}</span> | 
        Desabilitadas: <span style="color: red">${disabledCategories}</span>
        | <button onclick="exportCategoryStatus()" style="background-color: #6c757d; color: white; border: none; padding: 2px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">
            Exportar Status
        </button>
        <button onclick="importCategoryStatus()" style="background-color: #17a2b8; color: white; border: none; padding: 2px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">
            Importar Status
        </button>
    `;
}

// A função para obter os dados continua a mesma, pois você está lendo o JSON do storage.
function getCategoryStatusFromStorage() {
    return JSON.parse(localStorage.getItem('categoryStatus')) || {};
}

// FUNÇÃO DE CONVERSÃO DE DADOS (NOVA)

function convertJSONToCSV(data) {
    if (!data || Object.keys(data).length === 0) {
        return ""; // Retorna vazio se não houver dados
    }


    const allStatuses = Object.values(data);
    if (allStatuses.length === 0) {
        return "";
    }

    const headerKeys = ['ID', ...Object.keys(allStatuses[0])];

    const csvHeader = headerKeys.join(';');
    const csvRows = Object.entries(data).map(([id, statusObject]) => {
        // Mapeia os valores na ordem dos cabeçalhos, começando pelo ID
        const values = headerKeys.map(key => {
            if (key === 'ID') {
                return id; // Retorna a chave (ID)
            }

            let value = statusObject[key];

            if (typeof value === 'string' && value.includes(';')) {
                value = `"${value.replace(/"/g, '""')}"`; // Envolve em aspas se contiver o separador
            }
            return value;
        });
        return values.join(';');
    });

    return [csvHeader, ...csvRows].join('\n');
}

function exportCategoryStatus() {
    const categoryStatusJSON = getCategoryDataFromTable();
    const csvString = convertJSONToCSV(categoryStatusJSON);

    if (csvString.length === 0) {
        alert("Não há dados de status para exportar.");
        return;
    }

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement("a");

    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "category_status_export.csv"); // Nome do arquivo de saída

    // 4. Dispara o clique e remove o link
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function importCategoryStatus() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const importedStatus = JSON.parse(e.target.result);
                localStorage.setItem('categoryStatus', JSON.stringify(importedStatus));
                alert('Status importado com sucesso! Recarregando categorias...');
                loadCategories();
            } catch (error) {
                alert('Erro ao importar arquivo. Certifique-se de que é um JSON válido.');
            }
        };

        reader.readAsText(file);
    };

    input.click();
}

async function loadCategoryForEdit() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/categories/${id}`);
        if (!response.ok) throw new Error('Category not found');

        const cat = await response.json();
        document.getElementById('editCategoryId').value = cat.id;
        document.getElementById('editName').value = cat.name;
        document.getElementById('editDescription').value = cat.description;
        document.getElementById('editParentId').value = cat.parentCategoryId || '';
        document.getElementById('editEnabled').value = String(cat.enabled ?? true);
        const currentImage = document.getElementById('currentCategoryImage');
        if (currentImage) {
            const previewUrl = resolveCategoryImage(cat);
            currentImage.innerHTML = `<img src="${previewUrl}" alt="${cat.name}" onerror="this.src='https://via.placeholder.com/120'>`;
        }
    } catch (error) {
        alert('Error loading category details');
        window.location.href = 'categories.html';
    }
}

const editForm = document.getElementById('editCategoryForm');
if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editCategoryId').value;
        const formData = new FormData();

        formData.append('name', document.getElementById('editName').value);
        formData.append('description', document.getElementById('editDescription').value);

        const parentId = document.getElementById('editParentId').value;
        if (parentId) formData.append('parentCategoryId', parentId);

        const enabledValue = document.getElementById('editEnabled').value;
        formData.append('enabled', enabledValue);

        const imageFile = document.getElementById('editImage')?.files?.[0];
        if (imageFile) {
            formData.append('imageFile', imageFile);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
                method: 'PUT',
                body: formData
            });

            if (response.ok) {
                setCategoryStatus(id, enabledValue === 'true');
                alert('Category updated successfully!');
                window.location.href = 'categories.html';
            } else {
                const msg = await response.text();
                alert(msg || 'Failed to update category');
            }
        } catch (error) {
            console.error(error);
            alert('Error updating category');
        }
    });
}

if (document.getElementById('editCategoryForm')) {
    document.addEventListener('DOMContentLoaded', loadCategoryForEdit);
}

async function loadProductsFromApi() {
    try {
        const response = await fetch(`${API_BASE_URL}/products?size=200`, {
            method: 'GET',
            // ALTERAÇÃO: Não usar getJsonHeaders() aqui para evitar enviar token inválido
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 401) {
            alert("Sessão expirada");
            logout();
            return;
        }

        if (!response.ok) throw new Error('Failed to load products');
        
        const page = await response.json();
        products = (page.content || []).map(mapApiProductToUi);
        displayProducts();
    } catch (error) {
        console.error(error);
        alert('Erro ao carregar produtos da API.');
    }
}
