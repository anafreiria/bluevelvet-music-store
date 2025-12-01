// API base for backend integration
const API_BASE_URL = 'http://localhost:8081';

// User authentication and registration (frontend-only stub)
const users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

function register() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    const user = { name, email, password, role };
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
    alert('Registration successful. Please login.');
    window.location.href = 'index.html';
}

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = 'dashboard.html';
    } else {
        alert('Invalid email or password');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Product management (backed by API)
let products = [];
const ITEMS_PER_PAGE = 5;
let currentPage = 1;

function mapApiProductToUi(apiProduct) {
    const placeholderMain = getUnsplashImage(200, 200, apiProduct.category || 'music');
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
        mainImage: apiProduct.mainImage || placeholderMain,
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

        alert('Product added successfully');
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error(error);
        alert('Error creating product. Please try again.');
    }
}

async function loadProductsFromApi() {
    try {
        const response = await fetch(`${API_BASE_URL}/products?size=200`);
        if (!response.ok) {
            throw new Error('Failed to load products');
        }
        const page = await response.json();
        products = (page.content || []).map(mapApiProductToUi);
        displayProducts();
    } catch (error) {
        console.error(error);
        alert('Erro ao carregar produtos da API.');
    }
}

async function fetchProductById(id) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
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

function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete product');
            }
            products = products.filter(p => p.id !== id);
            displayProducts();
        })
        .catch(error => {
            console.error(error);
            alert('Error deleting product.');
        });
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

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeProducts();
    const path = window.location.pathname;

    if (path.includes('index.html')) {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            login();
        });
    } else if (path.includes('register.html')) {
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            register();
        });
    } else if (path.includes('dashboard.html')) {
        if (!currentUser) {
            window.location.href = 'index.html';
        } else {
            document.getElementById('userInfo').textContent = `Welcome, ${currentUser.name} (${currentUser.role})`;
            document.getElementById('logoutBtn').addEventListener('click', logout);
            document.getElementById('categoriesBtn').addEventListener('click', () => {
                window.location.href = 'categories.html';
            });
            document.getElementById('addProductBtn').addEventListener('click', () => {
                if (['admin', 'editor'].includes(currentUser.role)) {
                    window.location.href = 'add-product.html';
                } else {
                    alert('You do not have permission to add products.');
                }
            });
            document.getElementById('sortSelect').addEventListener('change', sortProducts);
            document.getElementById('searchInput').addEventListener('input', searchProducts);
            displayProducts();
        }
    } else if (path.includes('add-product.html')) {
        if (!currentUser || !['admin', 'editor'].includes(currentUser.role)) {
            window.location.href = 'dashboard.html';
        } else {
            document.getElementById('addProductForm').addEventListener('submit', addProduct);
            document.getElementById('addDetailBtn').addEventListener('click', addDetailField);
        }
    } else if (path.includes('edit-product.html')) {
        if (!currentUser || !['admin', 'editor', 'salesperson'].includes(currentUser.role)) {
            window.location.href = 'dashboard.html';
        } else {
            loadEditForm();
            document.getElementById('editProductForm').addEventListener('submit', updateProduct);
            document.getElementById('addDetailBtn').addEventListener('click', addDetailField);
        }
    } else if (path.includes('view-product.html')) {
        if (!currentUser) {
            window.location.href = 'index.html';
        } else {
            loadProductDetails();
        }
    } else if (path.includes('categories.html')) {
        if (!currentUser) {
            window.location.href = 'index.html';
        } else {
            document.getElementById('userInfo').textContent = `Welcome, ${currentUser.name} (${currentUser.role})`;
            document.getElementById('logoutBtn').addEventListener('click', logout);
            document.getElementById('categoryForm').addEventListener('submit', createCategory);
            loadCategories();
        }
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

async function createCategory(event) {
    event.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('categoryName').value);
    formData.append('description', document.getElementById('categoryDescription').value);

    const parentId = document.getElementById('parentCategoryId').value;
    if (parentId) formData.append('parentCategoryId', parentId);

    try {
        const response = await fetch(`${API_BASE_URL}/api/categories`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Failed to create category');

        alert('Category created!');
        document.getElementById('categoryForm').reset();
        loadCategories();
    } catch (error) {
        console.error(error);
        alert('Error creating category.');
    }
}

async function loadCategories() {
    const tableBody = document.getElementById('categoryList');
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        const categories = await response.json();

        tableBody.innerHTML = '';
        categories.forEach(cat => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cat.id}</td>
                <td>${cat.name}</td>
                <td>${cat.description}</td>
                <td>${cat.parentCategoryId || '-'}</td>
                <td>
                    <button onclick="window.location.href='edit-category.html?id=${cat.id}'">Edit</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
        tableBody.innerHTML = '<tr><td colspan="5">Error loading categories</td></tr>';
    }
}

// Funções para a página de Edição (edit-category.html)
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
        // Assumindo que o back retorna 'enabled', se não, ajuste aqui
        // document.getElementById('editEnabled').value = cat.enabled;
    } catch (error) {
        alert('Error loading category details');
        window.location.href = 'categories.html';
    }
}

// Adicionar Listener no formulário de edição se ele existir
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

        formData.append('enabled', document.getElementById('editEnabled').value);

        const imageFile = document.getElementById('editImage').files[0];
        if (imageFile) {
            formData.append('imageFile', imageFile);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
                method: 'PUT',
                body: formData
            });

            if (response.ok) {
                alert('Category updated successfully!');
                window.location.href = 'categories.html';
            } else {
                alert('Failed to update category');
            }
        } catch (error) {
            console.error(error);
            alert('Error updating category');
        }
    });
}

// Listener para carregar categorias na página de lista
if (document.getElementById('categoriesTable')) {
    document.addEventListener('DOMContentLoaded', loadCategories);
    const createForm = document.getElementById('categoryForm');
    if(createForm) createForm.addEventListener('submit', createCategory);
}
