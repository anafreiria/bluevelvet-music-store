const API_BASE_URL = 'http://localhost:8081';

// --- HELPER DE IMAGEM ---
function getImageUrl(imageName) {
    if (!imageName) return 'https://via.placeholder.com/300x400?text=No+Image';
    if (imageName.startsWith('http')) return imageName;
    let cleanPath = imageName.startsWith('/') ? imageName.substring(1) : imageName;
    if (cleanPath.startsWith('user-images/')) cleanPath = cleanPath.replace('user-images/', '');
    return `${API_BASE_URL}/user-images/${cleanPath}`;
}

function handleImageError(img) {
    img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgMzAwIDQwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzIzMjcyZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM4Yjk0OWUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlNlbSBJbWFnZW08L3RleHQ+PC9zdmc+';
}

// --- VARIÁVEIS GLOBAIS ---
let masterProductList = [], products = [], masterCategoryList = [], categories = [];
const ITEMS_PER_PAGE = 8;
let currentPage = 1;

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // Redireciona se não logado (exceto login/registro)
    if (!currentUser && !path.includes('index.html') && !path.includes('register.html')) {
        // window.location.href = 'index.html';
    }

    // --- CONTROLE DE PERMISSÕES (VISUAL) ---
    if (currentUser) {
        const role = currentUser.role;

        const userDisplay = document.getElementById('userInfo');
        if (userDisplay) userDisplay.textContent = `Olá, ${currentUser.name} (${role})`;

        const btnRegisterUser = document.getElementById('registerUserBtn');
        if (btnRegisterUser && role === 'ADMIN') {
            btnRegisterUser.classList.remove('hidden');
            btnRegisterUser.addEventListener('click', () => window.location.href = 'register.html');
        }

        if (role === 'CLIENTE') {
            const btnAdd = document.getElementById('addProductBtn');
            if (btnAdd) btnAdd.style.display = 'none';

            const btnCat = document.getElementById('categoriesBtn');
            if (btnCat) btnCat.style.display = 'none';
        }
    }

    // --- PASSO 5: LÓGICA DA TELA DE REGISTRO ---
    if (path.includes('register.html')) {
        const roleContainer = document.getElementById('roleContainer');
        const roleSelect = document.getElementById('role');
        const pageTitle = document.querySelector('h1');

        // Se NÃO for Admin logado, é um cadastro público de Cliente
        if (!currentUser || currentUser.role !== 'ADMIN') {
            if(roleContainer) roleContainer.style.display = 'none'; // Esconde
            if(roleSelect) roleSelect.value = 'CLIENTE'; // Força Cliente
            if(pageTitle) pageTitle.innerText = "Criar Conta";
        }
        // Se for Admin, deixa tudo visível
    }

    // --- LISTENERS GLOBAIS ---
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    const loginForm = document.getElementById('loginForm');
    if(loginForm) loginForm.addEventListener('submit', performLogin);

    const registerForm = document.getElementById('registerForm');
    if(registerForm) registerForm.addEventListener('submit', registerUser);

    document.getElementById('categoriesBtn')?.addEventListener('click', () => window.location.href = 'categories.html');
    document.getElementById('addProductBtn')?.addEventListener('click', () => window.location.href = 'add-product.html');

    // Roteamento
    if (path.includes('dashboard.html')) {
        document.getElementById('searchInput')?.addEventListener('input', applyProductFilters);
        document.getElementById('sortSelect')?.addEventListener('change', applyProductFilters);
        loadProductsFromApi();
    } else if (path.includes('categories.html')) {
        document.getElementById('catSearchInput')?.addEventListener('input', applyCategoryFilters);
        document.getElementById('catSortSelect')?.addEventListener('change', applyCategoryFilters);

        if (canWrite()) {
            document.getElementById('categoryForm')?.addEventListener('submit', createCategory);
        } else {
            const btnCreate = document.querySelector('button[onclick*="createCategorySection"]');
            if(btnCreate) btnCreate.style.display = 'none';
        }
        loadCategories();
    } else if (path.includes('add-product.html')) {
        if(!canWrite()) { alert("Acesso Negado"); window.location.href = 'dashboard.html'; }
        document.getElementById('addProductForm')?.addEventListener('submit', createProduct);
        document.getElementById('addDetailBtn')?.addEventListener('click', () => addDetailRow());
        populateCategorySelect('prodCategory');
    } else if (path.includes('edit-product.html')) {
        if(!canWrite()) { alert("Acesso Negado"); window.location.href = 'dashboard.html'; }
        document.getElementById('editProductForm')?.addEventListener('submit', updateProduct);
        document.getElementById('addDetailBtn')?.addEventListener('click', () => addDetailRow());
        loadProductForEdit();
    } else if (path.includes('view-product.html')) {
        loadProductDetailsView();
    } else if (path.includes('edit-category.html')) {
        if(!canWrite()) { alert("Acesso Negado"); window.location.href = 'categories.html'; }
        loadCategoryForEdit();
        const fileInput = document.getElementById('editImage');
        if(fileInput) {
            fileInput.addEventListener('change', function(e) {
                if(this.files && this.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = document.getElementById('currentImagePreview');
                        if(img) {
                            img.src = e.target.result;
                            img.classList.remove('hidden');
                            document.getElementById('noImageText').classList.add('hidden');
                        }
                    }
                    reader.readAsDataURL(this.files[0]);
                }
            });
        }
    }
});

// --- AUTH HELPERS ---
async function performLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
        });
        if (response.ok) {
            const userData = await response.json();
            const authHeader = 'Basic ' + btoa(`${email}:${password}`);
            localStorage.setItem('currentUser', JSON.stringify({ id: userData.id, name: userData.name, email: userData.email, role: userData.role, authHeader: authHeader }));
            window.location.href = 'dashboard.html';
        } else { alert("E-mail ou senha incorretos."); }
    } catch (error) { alert("Erro de conexão."); }
}

function getAuthHeader() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    return user ? user.authHeader : null;
}

function canWrite() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    return user && (user.role === 'ADMIN' || user.role === 'EDITOR' || user.role === 'SALES_MANAGER');
}

// --- PASSO 5: LÓGICA DE REGISTRO ATUALIZADA ---
async function registerUser(e) {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // Define a Role: Se for Admin, pega do select. Se for público, é CLIENTE.
    let roleToSend = 'CLIENTE';
    if (currentUser && currentUser.role === 'ADMIN') {
        roleToSend = document.getElementById('role').value;
    }

    const userData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        role: roleToSend
    };

    // Define o Header: Se tem usuário logado, manda o token. Se não, manda vazio.
    const headers = { 'Content-Type': 'application/json' };
    if (currentUser && currentUser.authHeader) {
        headers['Authorization'] = currentUser.authHeader;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            alert("Cadastro realizado com sucesso!");
            if (!currentUser) {
                window.location.href = 'index.html'; // Se era público, vai pro login
            } else {
                document.getElementById('registerForm').reset(); // Se era admin, limpa
            }
        } else {
            const txt = await response.text();
            alert(`Erro: ${txt}`);
        }
    } catch (e) { alert("Erro de conexão."); }
}

// --- PRODUTOS & UI ---
async function loadProductsFromApi() {
    const container = document.getElementById('productList');
    if(!container) return;
    try {
        const response = await fetch(`${API_BASE_URL}/products?size=200`);
        const page = await response.json();
        masterProductList = (page.content || page).map(mapApiProductToUi);
        products = [...masterProductList];
        applyProductFilters();
    } catch (error) { container.innerHTML = `<p class="col-span-full text-center text-red-500">Erro API</p>`; }
}

function mapApiProductToUi(p) {
    return { id: p.id, name: p.name, category: p.category || 'Geral', mainImage: getImageUrl(p.mainImage), listPrice: p.listPrice || 0, brand: p.brand || '' };
}

function applyProductFilters() {
    const term = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const sort = document.getElementById('sortSelect')?.value || 'name';
    products = masterProductList.filter(p => (p.name && p.name.toLowerCase().includes(term)) || (p.brand && p.brand.toLowerCase().includes(term)) || (p.category && p.category.toLowerCase().includes(term)));
    products.sort((a, b) => sort === 'listPrice' ? a.listPrice - b.listPrice : a.name.localeCompare(b.name));
    displayProducts();
}

function displayProducts() {
    const container = document.getElementById('productList');
    if (!container) return;
    const showActions = canWrite();
    container.innerHTML = products.length ? products.map(p => `
        <div class="group flex flex-col rounded-xl border border-border-dark bg-card-dark overflow-hidden hover:-translate-y-1 transition-all cursor-pointer" onclick="window.location.href='view-product.html?id=${p.id}'">
            <div class="relative aspect-[4/5] bg-background-dark overflow-hidden">
                <img class="h-full w-full object-cover" src="${p.mainImage}" onerror="handleImageError(this)">
                <div class="absolute top-3 left-3"><span class="bg-primary/90 px-2 py-1 text-xs font-bold text-white rounded">${p.category}</span></div>
            </div>
            <div class="p-4 flex flex-col gap-2 flex-1">
                <h3 class="text-white font-bold text-lg leading-snug line-clamp-2">${p.name}</h3>
                <p class="text-text-dim text-xs">${p.brand}</p>
                <div class="mt-auto pt-4 flex items-end justify-between">
                    <span class="text-xl font-bold text-primary">R$ ${p.listPrice.toFixed(2)}</span>
                    ${showActions ? `<div class="flex gap-2" onclick="event.stopPropagation()"><button onclick="window.location.href='edit-product.html?id=${p.id}'" class="p-2 text-slate-400 hover:text-white bg-border-dark rounded"><span class="material-symbols-outlined text-sm">edit</span></button><button onclick="deleteProduct(${p.id})" class="p-2 text-red-400 hover:text-red-300 bg-red-900/20 rounded"><span class="material-symbols-outlined text-sm">delete</span></button></div>` : ''}
                </div>
            </div>
        </div>`).join('') : '<p class="col-span-full text-center">Nada encontrado.</p>';
}

// --- CRUD ---
async function createProduct(e) {
    e.preventDefault(); if(!canWrite()) return;
    try {
        const res = await fetch(`${API_BASE_URL}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': getAuthHeader() }, body: JSON.stringify(collectProductFormData('')) });
        if(!res.ok) throw new Error(await res.text());
        const created = await res.json();
        const mainFile = document.getElementById('prodImage').files[0];
        if(mainFile) await uploadImage(created.id, mainFile, 'image');
        const extraFiles = document.getElementById('prodAdditionalImages').files;
        if(extraFiles.length > 0) await uploadImagesBatch(created.id, extraFiles);
        alert('Criado!'); window.location.href = 'dashboard.html';
    } catch(err) { alert('Erro: ' + err.message); }
}

async function updateProduct(e) {
    e.preventDefault(); if(!canWrite()) return;
    const id = document.getElementById('editProdId').value;
    try {
        await fetch(`${API_BASE_URL}/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': getAuthHeader() }, body: JSON.stringify(collectProductFormData('edit')) });
        const mainFile = document.getElementById('editProdImage').files[0];
        if(mainFile) await uploadImage(id, mainFile, 'image');
        const extraFiles = document.getElementById('editAdditionalImages').files;
        if(extraFiles.length > 0) await uploadImagesBatch(id, extraFiles);
        alert('Atualizado!'); window.location.href = 'dashboard.html';
    } catch(err) { alert('Erro'); }
}

async function deleteProduct(id) {
    if(!confirm("Deletar?")) return;
    try { const res = await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE', headers: { 'Authorization': getAuthHeader() } }); if(res.ok) loadProductsFromApi(); else alert("Erro: " + res.status); } catch(e) { alert("Erro"); }
}

async function uploadImage(id, file, endpointSuffix) {
    const formData = new FormData(); formData.append('file', file);
    await fetch(`${API_BASE_URL}/products/${id}/${endpointSuffix}`, { method: 'POST', body: formData, headers: { 'Authorization': getAuthHeader() } });
}
async function uploadImagesBatch(id, fileList) {
    const formData = new FormData();
    for (let i = 0; i < fileList.length; i++) formData.append('files', fileList[i]);
    await fetch(`${API_BASE_URL}/products/${id}/images`, { method: 'POST', body: formData, headers: { 'Authorization': getAuthHeader() } });
}

function collectProductFormData(prefix = '') {
    const getId = (name) => prefix ? `editProd${name}` : `prod${name}`;
    const getDim = (name) => prefix ? `editDim${name}` : `dim${name}`;
    const enabledInput = document.getElementById(prefix ? 'editProdEnabled' : 'prodEnabled');
    const stockInput = document.getElementById(prefix ? 'editProdInStock' : 'prodInStock');
    return {
        name: document.getElementById(getId('Name')).value,
        shortDescription: document.getElementById(getId('ShortDesc')).value,
        fullDescription: document.getElementById(getId('FullDesc')).value,
        brand: document.getElementById(getId('Brand')).value,
        category: document.getElementById(getId('Category')).value,
        listPrice: parseFloat(document.getElementById(getId('ListPrice')).value.replace(',','.')) || 0,
        cost: parseFloat(document.getElementById(getId('Cost')).value.replace(',','.')) || 0,
        isEnabled: enabledInput ? enabledInput.checked : true,
        inStock: stockInput ? stockInput.checked : true,
        dimension: {
            width: parseFloat(document.getElementById(getDim('Width')).value) || 0,
            height: parseFloat(document.getElementById(getDim('Height')).value) || 0,
            length: parseFloat(document.getElementById(getDim('Length')).value) || 0,
            weight: parseFloat(document.getElementById(getDim('Weight')).value) || 0
        },
        details: getProductDetailsFromUI()
    };
}
function addDetailRow(name = '', value = '') {
    const container = document.getElementById('detailsContainer'); if (!container) return;
    const div = document.createElement('div');
    div.className = 'grid grid-cols-2 gap-2 mb-2';
    div.innerHTML = `<input type="text" placeholder="Nome" class="detail-name w-full bg-[#0d1117] border border-border-dark rounded px-3 py-2 text-sm text-white" value="${name}"><div class="flex gap-2"><input type="text" placeholder="Valor" class="detail-value w-full bg-[#0d1117] border border-border-dark rounded px-3 py-2 text-sm text-white" value="${value}"><button type="button" onclick="this.parentElement.parentElement.remove()" class="text-red-400"><span class="material-symbols-outlined">delete</span></button></div>`;
    container.appendChild(div);
}
function getProductDetailsFromUI() {
    const details = [];
    const container = document.getElementById('detailsContainer');
    if(container) container.querySelectorAll('div.grid').forEach(row => {
        const name = row.querySelector('.detail-name').value;
        const value = row.querySelector('.detail-value').value;
        if(name && value) details.push({ name, value });
    });
    return details;
}
async function populateCategorySelect(selectId, selectedCategoryName = null) {
    const select = document.getElementById(selectId); if (!select) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        const cats = await response.json();
        select.innerHTML = '<option value="">Selecione...</option>';
        cats.filter(c => c.enabled).sort((a,b)=>a.name.localeCompare(b.name)).forEach(cat => {
            const opt = document.createElement('option'); opt.value = cat.id; opt.textContent = cat.name;
            if(selectedCategoryName === cat.name) opt.selected = true;
            select.appendChild(opt);
        });
    } catch(e) {}
}
async function loadCategories() {
    const container = document.getElementById('categoryList'); if (!container) return;
    try {
        const res = await fetch(`${API_BASE_URL}/api/categories`);
        masterCategoryList = await res.json();
        applyCategoryFilters();
    } catch (e) { container.innerHTML = '<div class="p-8 text-center text-red-500">Erro API</div>'; }
}
function applyCategoryFilters() {
    const term = document.getElementById('catSearchInput')?.value.toLowerCase() || '';
    const sort = document.getElementById('catSortSelect')?.value || 'name';
    categories = masterCategoryList.filter(c => c.name.toLowerCase().includes(term));
    categories.sort((a, b) => sort === 'id' ? a.id - b.id : a.name.localeCompare(b.name));
    displayCategories();
}
function displayCategories() {
    const container = document.getElementById('categoryList'); if (!container) return;
    const showActions = canWrite();
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
                    ${showActions ? `<button onclick="window.location.href='edit-category.html?id=${cat.id}'" class="p-2 text-slate-400 hover:text-white rounded"><span class="material-symbols-outlined text-[20px]">edit</span></button><button onclick="deleteCategory(${cat.id})" class="p-2 text-red-400 hover:text-red-300 rounded"><span class="material-symbols-outlined text-[20px]">delete</span></button>` : ''}
                </div>
            </div>
        </div>`).join('');
}
async function createCategory(e) {
    e.preventDefault(); if(!canWrite()) return;
    const formData = new FormData();
    formData.append('name', document.getElementById('categoryName').value);
    formData.append('description', document.getElementById('categoryDescription').value);
    const pId = document.getElementById('parentCategoryId').value;
    if (pId) formData.append('parentCategoryId', pId);
    formData.append('enabled', true);
    try {
        const res = await fetch(`${API_BASE_URL}/api/categories`, { method: 'POST', body: formData, headers: { 'Authorization': getAuthHeader() }});
        if (res.ok) { alert('Criado!'); loadCategories(); } else alert('Erro');
    } catch (e) { alert('Erro'); }
}
async function deleteCategory(id) {
    if(!confirm("Excluir?")) return;
    try { const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, { method: 'DELETE', headers: { 'Authorization': getAuthHeader() } }); if(res.ok) loadCategories(); else alert("Erro"); } catch(e) { alert("Erro"); }
}
async function loadCategoryForEdit() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id'); if (!id) return;
    try {
        const res = await fetch(`${API_BASE_URL}/api/categories/${id}`);
        if (!res.ok) throw new Error("Falha ao buscar categoria");
        const cat = await res.json();
        document.getElementById('editCategoryId').value = cat.id;
        document.getElementById('editName').value = cat.name;
        document.getElementById('editDescription').value = cat.description || '';
        document.getElementById('editParentId').value = cat.parentCategoryId || '';
        document.getElementById('editEnabled').value = cat.enabled ? "true" : "false";
        const imgPreview = document.getElementById('currentImagePreview');
        const noImgText = document.getElementById('noImageText');
        if (imgPreview && noImgText) {
            if (cat.image && cat.image.trim() !== "") {
                imgPreview.src = getImageUrl(cat.image);
                imgPreview.classList.remove('hidden');
                noImgText.classList.add('hidden');
                imgPreview.onerror = function() {
                    this.classList.add('hidden');
                    noImgText.classList.remove('hidden');
                    noImgText.innerText = "Imagem não encontrada (404)";
                };
            } else {
                imgPreview.classList.add('hidden');
                noImgText.classList.remove('hidden');
            }
        }
    } catch (e) { console.error(e); }
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
            const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, { method: 'PUT', body: formData, headers: { 'Authorization': getAuthHeader() } });
            if(res.ok) { alert('Atualizado!'); window.location.href = 'categories.html'; } else alert('Erro');
        } catch(err) { console.error(err); }
    });
}
async function loadProductDetailsView() {
    const id = new URLSearchParams(window.location.search).get('id'); if(!id) return;
    try {
        const res = await fetch(`${API_BASE_URL}/products/${id}`);
        const p = await res.json();
        document.getElementById('viewProdName').innerText = p.name;
        document.getElementById('viewProdCategory').innerText = p.category;
        document.getElementById('viewProdPrice').innerText = `R$ ${p.listPrice.toFixed(2)}`;
        document.getElementById('viewProdShortDesc').innerText = p.shortDescription || '';
        document.getElementById('viewProdFullDesc').innerText = p.fullDescription || '';
        const detailsList = document.getElementById('viewProdDetails');
        detailsList.innerHTML = (p.details && p.details.length) ? p.details.map(d => `<li class="flex justify-between py-2 border-b border-border-dark"><span class="text-text-dim">${d.name}</span><span class="text-white">${d.value}</span></li>`).join('') : '<li class="text-text-dim py-2">Sem detalhes.</li>';
        if(p.dimension) document.getElementById('viewDim').innerText = `${p.dimension.height}x${p.dimension.width}x${p.dimension.length}cm (${p.dimension.weight}kg)`;
        const mainImg = document.getElementById('viewProdImage');
        const galleryContainer = document.getElementById('galleryContainer');
        mainImg.src = getImageUrl(p.mainImage);
        if (p.additionalImages && p.additionalImages.length > 0) {
            galleryContainer.classList.remove('hidden');
            const allImages = [p.mainImage, ...p.additionalImages];
            galleryContainer.innerHTML = allImages.map(imgName => `<div class="h-20 w-20 shrink-0 border border-border-dark rounded-md overflow-hidden cursor-pointer hover:border-primary transition-colors" onclick="document.getElementById('viewProdImage').src='${getImageUrl(imgName)}'"><img src="${getImageUrl(imgName)}" class="w-full h-full object-cover"></div>`).join('');
        }
    } catch(e) { console.error(e); }
}
async function loadProductForEdit() {
    const id = new URLSearchParams(window.location.search).get('id'); if(!id) return;
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
        const container = document.getElementById('detailsContainer');
        if (container) {
            container.innerHTML = '';
            if(p.details) p.details.forEach(d => addDetailRow(d.name, d.value));
        }
    } catch(e) { console.error(e); }
}