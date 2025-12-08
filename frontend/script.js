const API_BASE_URL = 'http://localhost:8081';

// --- HELPER: CORREÇÃO DE URL DE IMAGEM ---
function getImageUrl(imageName) {
    if (!imageName) return 'https://via.placeholder.com/300x400?text=No+Image';
    if (imageName.startsWith('http')) return imageName;
    let cleanPath = imageName.startsWith('/') ? imageName.substring(1) : imageName;
    if (cleanPath.startsWith('user-images/')) {
        cleanPath = cleanPath.replace('user-images/', '');
    }
    return `${API_BASE_URL}/user-images/${cleanPath}`;
}

// --- AUTH ---
const users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const user = users.find(u => u.email === email && u.password === password) || { name: 'Admin', email: email, role: 'admin' };
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = 'dashboard.html';
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// --- PRODUCTS CRUD & FILTER ---
let masterProductList = []; // Lista completa original (Backup)
let products = [];          // Lista filtrada que aparece na tela
const ITEMS_PER_PAGE = 8;
let currentPage = 1;

async function loadProductsFromApi() {
    const container = document.getElementById('productList');
    if(!container) return;

    try {
        // Carrega tudo da API
        const response = await fetch(`${API_BASE_URL}/products?size=200`);
        if (!response.ok) throw new Error('Falha ao carregar produtos');
        const page = await response.json();

        // Mapeia e salva na lista Mestra e na lista de Exibição
        masterProductList = (page.content || []).map(mapApiProductToUi);
        products = [...masterProductList]; // Cópia inicial

        // Aplica filtros iniciais (caso o navegador tenha guardado algo no input)
        applyFilters();
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="text-red-500 text-center col-span-full">Erro ao conectar com API (${API_BASE_URL}). Verifique se o Backend está rodando.</p>`;
    }
}

function mapApiProductToUi(apiProduct) {
    return {
        id: apiProduct.id,
        name: apiProduct.name,
        category: apiProduct.category || 'Geral',
        mainImage: getImageUrl(apiProduct.mainImage),
        listPrice: apiProduct.listPrice || 0,
        brand: apiProduct.brand || ''
    };
}

// --- NOVA FUNÇÃO DE FILTRO E ORDENAÇÃO ---
function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const sortBy = document.getElementById('sortSelect')?.value || 'name';

    // 1. Filtrar (Busca por Nome, Marca ou Categoria)
    let filtered = masterProductList.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.brand.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm)
    );

    // 2. Ordenar
    filtered.sort((a, b) => {
        if (sortBy === 'listPrice') {
            return a.listPrice - b.listPrice; // Menor preço primeiro
        } else {
            return a.name.localeCompare(b.name); // Alfabética (A-Z)
        }
    });

    // 3. Atualizar lista global e resetar página
    products = filtered;
    currentPage = 1;
    displayProducts();
}

function displayProducts() {
    const container = document.getElementById('productList');
    if (!container) return;

    container.innerHTML = '';

    // Paginação
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = products.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    if (paginated.length === 0) {
        container.innerHTML = '<p class="text-slate-500 text-center col-span-full py-10">Nenhum produto encontrado.</p>';
        return;
    }

    paginated.forEach(p => {
        const card = document.createElement('div');
        card.className = "group flex flex-col rounded-xl border border-border-dark bg-card-dark overflow-hidden hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300";
        card.innerHTML = `
            <div class="relative aspect-[4/5] bg-background-dark overflow-hidden">
                <img class="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500" src="${p.mainImage}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300x400?text=Error'">
                <div class="absolute top-3 left-3">
                    <span class="inline-flex items-center rounded-md bg-primary/90 px-2 py-1 text-xs font-bold text-white shadow-sm">${p.category}</span>
                </div>
            </div>
            <div class="flex flex-1 flex-col p-4 gap-2">
                <div class="flex justify-between items-start">
                    <h3 class="text-white font-bold text-lg leading-snug line-clamp-2">${p.name}</h3>
                </div>
                <p class="text-text-dim text-xs">${p.brand}</p>
                <div class="mt-auto pt-4 flex items-end justify-between">
                    <span class="text-xl font-bold text-primary">R$ ${p.listPrice.toFixed(2)}</span>
                    <div class="flex gap-2">
                        <button onclick="window.location.href='edit-product.html?id=${p.id}'" class="text-slate-400 hover:text-white p-2 bg-border-dark rounded transition-colors" title="Editar"><span class="material-symbols-outlined text-sm">edit</span></button>
                        <button onclick="deleteProduct(${p.id})" class="text-red-400 hover:text-red-300 p-2 bg-red-900/20 rounded transition-colors" title="Deletar"><span class="material-symbols-outlined text-sm">delete</span></button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

async function deleteProduct(id) {
    if(!confirm("Deletar produto?")) return;
    try {
        await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' });
        loadProductsFromApi(); // Recarrega do servidor
    } catch(e) { alert("Erro ao deletar"); }
}

// ... (Funções createProduct, loadProductForEdit, updateProduct - MANTENHA AS MESMAS DO ANTERIOR) ...
// Para economizar espaço, mantenha as funções de CRUD de produtos que fizemos na última resposta
// (createProduct, loadProductForEdit, updateProduct, loadCategories, createCategory, loadCategoryForEdit, editCategoryForm listener)
// Apenas cole o bloco de INIT abaixo no final.

async function createProduct(e) { /* ... Código anterior ... */
    e.preventDefault();
    const productData = {
        name: document.getElementById('prodName').value,
        shortDescription: document.getElementById('prodShortDesc').value,
        fullDescription: document.getElementById('prodFullDesc').value,
        brand: document.getElementById('prodBrand').value,
        category: document.getElementById('prodCategory').value,
        listPrice: parseFloat(document.getElementById('prodListPrice').value),
        cost: parseFloat(document.getElementById('prodCost').value) || 0,
        isEnabled: document.getElementById('prodEnabled').checked,
        inStock: document.getElementById('prodInStock').checked,
        dimension: {
            width: parseFloat(document.getElementById('dimWidth').value) || 0,
            height: parseFloat(document.getElementById('dimHeight').value) || 0,
            length: parseFloat(document.getElementById('dimLength').value) || 0,
            weight: parseFloat(document.getElementById('dimWeight').value) || 0
        }
    };
    try {
        const res = await fetch(`${API_BASE_URL}/products`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(productData) });
        if(!res.ok) throw new Error(await res.text());
        const createdProduct = await res.json();
        const file = document.getElementById('prodImage').files[0];
        if(file) {
            const formData = new FormData();
            formData.append('file', file);
            await fetch(`${API_BASE_URL}/products/${createdProduct.id}/image`, { method: 'POST', body: formData });
        }
        alert('Produto criado com sucesso!');
        window.location.href = 'dashboard.html';
    } catch(err) { console.error(err); alert('Erro ao criar: ' + err.message); }
}

async function loadProductForEdit() { /* ... Código anterior ... */
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if(!id) return;
    try {
        const res = await fetch(`${API_BASE_URL}/products/${id}`);
        const p = await res.json();
        document.getElementById('editProdId').value = p.id;
        document.getElementById('editProdName').value = p.name;
        document.getElementById('editProdBrand').value = p.brand;
        await populateCategorySelect('editProdCategory', p.category);
        document.getElementById('editProdShortDesc').value = p.shortDescription;
        document.getElementById('editProdFullDesc').value = p.fullDescription;
        document.getElementById('editProdListPrice').value = p.listPrice;
        document.getElementById('editProdCost').value = p.cost;
        document.getElementById('editProdEnabled').checked = p.isEnabled;
        document.getElementById('editProdInStock').checked = p.inStock;
        if(p.dimension) {
            document.getElementById('editDimWidth').value = p.dimension.width;
            document.getElementById('editDimHeight').value = p.dimension.height;
            document.getElementById('editDimLength').value = p.dimension.length;
            document.getElementById('editDimWeight').value = p.dimension.weight;
        }
        if(p.mainImage) {
            const img = document.getElementById('currentProdImage');
            img.src = getImageUrl(p.mainImage);
            img.classList.remove('hidden');
            document.getElementById('noProdImageText').classList.add('hidden');
        }
    } catch(e) { alert('Erro ao carregar produto'); }
}

async function updateProduct(e) { /* ... Código anterior ... */
    e.preventDefault();
    const id = document.getElementById('editProdId').value;
    const productData = {
        name: document.getElementById('editProdName').value,
        shortDescription: document.getElementById('editProdShortDesc').value,
        fullDescription: document.getElementById('editProdFullDesc').value,
        brand: document.getElementById('editProdBrand').value,
        category: document.getElementById('editProdCategory').value,
        listPrice: parseFloat(document.getElementById('editProdListPrice').value),
        cost: parseFloat(document.getElementById('editProdCost').value) || 0,
        isEnabled: document.getElementById('editProdEnabled').checked,
        inStock: document.getElementById('editProdInStock').checked,
        dimension: {
            width: parseFloat(document.getElementById('editDimWidth').value) || 0,
            height: parseFloat(document.getElementById('editDimHeight').value) || 0,
            length: parseFloat(document.getElementById('editDimLength').value) || 0,
            weight: parseFloat(document.getElementById('editDimWeight').value) || 0
        }
    };
    try {
        await fetch(`${API_BASE_URL}/products/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(productData) });
        const file = document.getElementById('editProdImage').files[0];
        if(file) {
            const formData = new FormData();
            formData.append('file', file);
            await fetch(`${API_BASE_URL}/products/${id}/image`, { method: 'POST', body: formData });
        }
        alert('Atualizado!');
        window.location.href = 'dashboard.html';
    } catch(e) { alert('Erro ao atualizar'); }
}

// --- CATEGORIES & HELPERS ---
async function populateCategorySelect(selectId, selectedCategoryName = null) {
    const select = document.getElementById(selectId);
    if (!select) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        const categories = await response.json();
        select.innerHTML = '<option value="">Selecione uma categoria</option>';
        const activeCategories = categories.filter(cat => cat.enabled).sort((a, b) => a.name.localeCompare(b.name));
        activeCategories.forEach(cat => {
            const option = document.createElement('option');
            // IMPORTANTE: O backend Product espera o NOME da categoria (string) ou ID.
            // O código Java ProductService usa: if (categoryInput.matches("\\d+")) ...
            // Vamos enviar o ID para garantir a busca correta.
            option.value = cat.id;
            option.textContent = cat.name;
            if (selectedCategoryName && selectedCategoryName === cat.name) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    } catch (error) {
        select.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

async function loadCategories() { /* ... Mantenha igual ao anterior ... */
    const container = document.getElementById('categoryList');
    if (!container) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        const categories = await response.json();
        container.innerHTML = categories.map(cat => `
            <div class="group hover:bg-[#252b3b] transition-colors duration-150">
                <div class="grid grid-cols-12 gap-4 px-6 py-3 items-center">
                    <div class="col-span-1 text-center text-slate-500 text-xs">${cat.id}</div>
                    <div class="col-span-4 flex items-center gap-3">
                        <div class="size-10 shrink-0 rounded-lg bg-slate-700 bg-cover bg-center border border-border-dark" style="background-image: url('${getImageUrl(cat.image)}');"></div>
                        <div class="flex flex-col"><span class="text-white font-medium text-sm">${cat.name}</span><span class="text-xs ${cat.enabled?'text-green-400':'text-red-400'}">${cat.enabled?'Ativo':'Inativo'}</span></div>
                    </div>
                    <div class="col-span-4 text-slate-400 text-sm truncate">${cat.description || '-'}</div>
                    <div class="col-span-2 text-center text-slate-500 text-sm">${cat.parentCategoryId || '-'}</div>
                    <div class="col-span-1 flex justify-end gap-1">
                        <button onclick="window.location.href='edit-category.html?id=${cat.id}'" class="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"><span class="material-symbols-outlined text-[20px]">edit</span></button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch(e) { container.innerHTML = '<div class="p-8 text-center text-red-500">Erro API</div>'; }
}

async function createCategory(event) { /* ... Mantenha igual ... */
    event.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('categoryName').value);
    const desc = document.getElementById('categoryDescription').value;
    if(desc) formData.append('description', desc);
    const parentId = document.getElementById('parentCategoryId').value;
    if (parentId) formData.append('parentCategoryId', parentId);
    formData.append('enabled', true);
    try {
        const response = await fetch(`${API_BASE_URL}/api/categories`, { method: 'POST', body: formData });
        if (response.ok) { alert('Categoria criada!'); document.getElementById('categoryForm').reset(); document.getElementById('createCategorySection').classList.add('hidden'); loadCategories(); }
        else { const txt = await response.text(); alert('Erro: ' + txt); }
    } catch (e) { alert('Erro de conexão'); }
}

async function loadCategoryForEdit() { /* ... Mantenha igual ... */
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;
    try {
        const res = await fetch(`${API_BASE_URL}/api/categories/${id}`);
        const cat = await res.json();
        document.getElementById('editCategoryId').value = cat.id;
        document.getElementById('editName').value = cat.name;
        document.getElementById('editDescription').value = cat.description || '';
        document.getElementById('editParentId').value = cat.parentCategoryId || '';
        document.getElementById('editEnabled').value = cat.enabled ? "true" : "false";
        if(cat.image) {
            const img = document.getElementById('currentImagePreview');
            img.src = getImageUrl(cat.image);
            img.classList.remove('hidden');
            document.getElementById('noImageText').classList.add('hidden');
        }
    } catch (e) { alert('Erro ao carregar'); }
}

if(document.getElementById('editCategoryForm')) {
    document.getElementById('editCategoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editCategoryId').value;
        const formData = new FormData();
        formData.append('name', document.getElementById('editName').value);
        formData.append('description', document.getElementById('editDescription').value);
        const pId = document.getElementById('editParentId').value;
        if(pId) formData.append('parentCategoryId', pId);
        formData.append('enabled', document.getElementById('editEnabled').value === "true");
        const file = document.getElementById('editImage').files[0];
        if(file) formData.append('imageFile', file);
        try {
            const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, { method: 'PUT', body: formData });
            if(res.ok) { alert('Atualizado!'); window.location.href = 'categories.html'; }
            else { alert('Falha'); }
        } catch(err) { console.error(err); }
    });
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    // Auth Logic
    if (!path.includes('index.html') && !path.includes('register.html') && !currentUser) {
        // window.location.href = 'index.html';
    }
    if (document.getElementById('userInfo') && currentUser) {
        document.getElementById('userInfo').textContent = `Olá, ${currentUser.name || 'Admin'}`;
    }
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) logoutBtn.addEventListener('click', logout);
    const loginForm = document.getElementById('loginForm');
    if(loginForm) loginForm.addEventListener('submit', (e) => { e.preventDefault(); login(); });

    // Routing Logic
    if (path.includes('dashboard.html')) {
        loadProductsFromApi();
        document.getElementById('categoriesBtn').addEventListener('click', () => window.location.href = 'categories.html');
        document.getElementById('addProductBtn').addEventListener('click', () => window.location.href = 'add-product.html');

        // NOVOS EVENT LISTENERS PARA FILTRO
        document.getElementById('searchInput').addEventListener('input', applyFilters);
        document.getElementById('sortSelect').addEventListener('change', applyFilters);

    } else if (path.includes('add-product.html')) {
        document.getElementById('addProductForm').addEventListener('submit', createProduct);
        populateCategorySelect('prodCategory');
    } else if (path.includes('edit-product.html')) {
        document.getElementById('editProductForm').addEventListener('submit', updateProduct);
        // loadProductForEdit já chama populateCategorySelect internamente
        loadProductForEdit();
    } else if (path.includes('categories.html')) {
        loadCategories();
        document.getElementById('categoryForm').addEventListener('submit', createCategory);
    } else if (path.includes('edit-category.html')) {
        loadCategoryForEdit();
        const fileInput = document.getElementById('editImage');
        if(fileInput) {
            fileInput.addEventListener('change', function(e) {
                if(this.files && this.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const img = document.getElementById('currentImagePreview');
                        img.src = e.target.result;
                        img.classList.remove('hidden');
                        document.getElementById('noImageText').classList.add('hidden');
                    }
                    reader.readAsDataURL(this.files[0]);
                }
            });
        }
    }
});