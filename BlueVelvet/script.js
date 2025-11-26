// User authentication and registration
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

// Product management
let products = JSON.parse(localStorage.getItem('products')) || [];
const ITEMS_PER_PAGE = 5;
let currentPage = 1;

function addProduct(event) {
    event.preventDefault();
    const product = {
        id: Date.now(),
        name: document.getElementById('name').value,
        shortDescription: document.getElementById('shortDescription').value,
        fullDescription: document.getElementById('fullDescription').value,
        brand: document.getElementById('brand').value,
        category: document.getElementById('category').value,
        mainImage: document.getElementById('mainImage').files[0] ? URL.createObjectURL(document.getElementById('mainImage').files[0]) : '',
        featuredImages: Array.from(document.getElementById('featuredImages').files).map(file => URL.createObjectURL(file)),
        listPrice: parseFloat(document.getElementById('listPrice').value),
        discountPercent: parseFloat(document.getElementById('discountPercent').value),
        enabled: document.getElementById('enabled').checked,
        inStock: document.getElementById('inStock').checked,
        length: parseFloat(document.getElementById('length').value),
        width: parseFloat(document.getElementById('width').value),
        height: parseFloat(document.getElementById('height').value),
        weight: parseFloat(document.getElementById('weight').value),
        cost: parseFloat(document.getElementById('cost').value),
        details: getProductDetails(),
        creationTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
    };

    products.push(product);
    localStorage.setItem('products', JSON.stringify(products));
    alert('Product added successfully');
    window.location.href = 'dashboard.html';
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

function displayProducts() {
    const productList = document.getElementById('productList');
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
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== id);
        localStorage.setItem('products', JSON.stringify(products));
        displayProducts();
    }
}

function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    const product = products.find(p => p.id === productId);

    if (product) {
        const detailsContainer = document.getElementById('productDetails');
        detailsContainer.innerHTML = `
            <h3>${product.name}</h3>
            <img src="${product.mainImage}" alt="${product.name}" width="200" onerror="this.src='https://via.placeholder.com/200'">
            <p><strong>Brand:</strong> ${product.brand}</p>
            <p><strong>Category:</strong> ${product.category}</p>
            <p><strong>Short Description:</strong> ${product.shortDescription}</p>
            <p><strong>Full Description:</strong> ${product.fullDescription}</p>
            <p><strong>List Price:</strong> $${product.listPrice.toFixed(2)}</p>
            <p><strong>Discount:</strong> ${product.discountPercent}%</p>
            <p><strong>Enabled:</strong> ${product.enabled ? 'Yes' : 'No'}</p>
            <p><strong>In Stock:</strong> ${product.inStock ? 'Yes' : 'No'}</p>
            <p><strong>Dimensions:</strong> ${product.length}" x ${product.width}" x ${product.height}"</p>
            <p><strong>Weight:</strong> ${product.weight} lbs</p>
            <p><strong>Cost:</strong> $${product.cost.toFixed(2)}</p>
            <p><strong>Creation Time:</strong> ${new Date(product.creationTime).toLocaleString()}</p>
            <p><strong>Update Time:</strong> ${new Date(product.updateTime).toLocaleString()}</p>
            <h4>Product Details:</h4>
            <ul>
                ${Object.entries(product.details).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}
            </ul>
            <h4>Featured Images:</h4>
            ${product.featuredImages.map(img => `<img src="${img}" alt="Featured Image" width="100" onerror="this.src='https://via.placeholder.com/100'">`).join('')}
        `;
    } else {
        alert('Product not found');
        window.location.href = 'dashboard.html';
    }
}

function loadEditForm() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    const product = products.find(p => p.id === productId);

    if (product) {
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
    } else {
        alert('Product not found');
        window.location.href = 'dashboard.html';
    }
}

function updateProduct(event) {
    event.preventDefault();
    const productId = parseInt(document.getElementById('productId').value);
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex !== -1) {
        const updatedProduct = {
            ...products[productIndex],
            name: document.getElementById('name').value,
            shortDescription: document.getElementById('shortDescription').value,
            fullDescription: document.getElementById('fullDescription').value,
            brand: document.getElementById('brand').value,
            category: document.getElementById('category').value,
            listPrice: parseFloat(document.getElementById('listPrice').value),
            discountPercent: parseFloat(document.getElementById('discountPercent').value),
            enabled: document.getElementById('enabled').checked,
            inStock: document.getElementById('inStock').checked,
            length: parseFloat(document.getElementById('length').value),
            width: parseFloat(document.getElementById('width').value),
            height: parseFloat(document.getElementById('height').value),
            weight: parseFloat(document.getElementById('weight').value),
            cost: parseFloat(document.getElementById('cost').value),
            details: getProductDetails(),
            updateTime: new Date().toISOString()
        };

        const mainImageFile = document.getElementById('mainImage').files[0];
        if (mainImageFile) {
            updatedProduct.mainImage = URL.createObjectURL(mainImageFile);
        }

        const featuredImageFiles = document.getElementById('featuredImages').files;
        if (featuredImageFiles.length > 0) {
            updatedProduct.featuredImages = Array.from(featuredImageFiles).map(file => URL.createObjectURL(file));
        }

        products[productIndex] = updatedProduct;
        localStorage.setItem('products', JSON.stringify(products));
        alert('Product updated successfully');
        window.location.href = 'dashboard.html';
    } else {
        alert('Product not found');
    }
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
        product.name.toLowerCase().includes(searchTerm) ||
        product.shortDescription.toLowerCase().includes(searchTerm) ||
        product.fullDescription.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
    displayFilteredProducts(filteredProducts);
}

function displayFilteredProducts(filteredProducts) {
    const productList = document.getElementById('productList');
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
    }
});


// const PRODUCT_DATA_VERSION = 1; // Increment this when you update the initial product list

function initializeProducts() {
    if (products.length === 0) {
        const initialProducts = [
            {
                id: 1,
                name: "Guided by Voices - Bee Thousand",
                shortDescription: "Indie rock classic on CD",
                fullDescription: "Bee Thousand is the seventh album by American indie rock band Guided by Voices, released on June 21, 1994. It is considered one of the best indie rock albums of the 1990s.",
                brand: "Matador Records",
                category: "CD",
                mainImage: "images/gbv-bee-thousand-cover.jpeg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 19.99,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 5,
                width: 5,
                height: 0.2,
                weight: 0.3,
                cost: 10.00,
                details: {
                    "Release Year": "1994",
                    "Condition": "New",
                    "Format": "CD"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 2,
                name: "Pavement - Slanted and Enchanted",
                shortDescription: "Iconic indie rock album in digital format",
                fullDescription: "Slanted and Enchanted is the debut studio album by American indie rock band Pavement, released on April 20, 1992. It is widely regarded as one of the most influential albums in the indie rock genre.",
                brand: "Domino Recording Co",
                category: "MP3",
                mainImage: "images/pavment-slanted-and-enchanted-cover.jpeg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 9.99,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 0,
                width: 0,
                height: 0,
                weight: 0,
                cost: 5.00,
                details: {
                    "Release Year": "1992",
                    "Condition": "New",
                    "Format": "MP3"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 3,
                name: "Neutral Milk Hotel T-Shirt",
                shortDescription: "Comfortable band t-shirt featuring Neutral Milk Hotel design",
                fullDescription: "Neutral Milk Hotel T-Shirt featuring artwork from their iconic album 'In the Aeroplane Over the Sea.' Made from 100% cotton, this t-shirt is perfect for fans of the band and indie rock enthusiasts.",
                brand: "Merge Records",
                category: "T-Shirt",
                mainImage: "images/neutral-milk-hotel-in-the-aeroplane-over-the-sea-tshirt.jpeg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 19.99,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 12,
                width: 10,
                height: 1,
                weight: 0.3,
                cost: 8.00,
                details: {
                    "Size": "M",
                    "Material": "100% Cotton",
                    "Color": "Black",
                    "Condition": "New"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 4,
                name: "Indie Rock 101",
                shortDescription: "Comprehensive guide to the indie rock scene",
                fullDescription: "Indie Rock 101 is an in-depth book covering the history, culture, and evolution of indie rock music. It provides insights into various bands, record labels, and the DIY approach that defines the genre.",
                brand: "Music Books",
                category: "Book",
                mainImage: "images/indie-101-book.jpg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 24.99,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 9,
                width: 6,
                height: 1,
                weight: 0.8,
                cost: 10.00,
                details: {
                    "Author": "Richard Wright",
                    "Publication Year": "2010",
                    "Condition": "New",
                    "Pages": 320
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 5,
                name: "The Jesus and Mary Chain Poster",
                shortDescription: "High-quality poster of The Jesus and Mary Chain",
                fullDescription: "This poster features an iconic image of The Jesus and Mary Chain, perfect for fans of the band and lovers of indie rock. Printed on high-quality paper, it’s ideal for decorating your space with a touch of music history.",
                brand: "Art & Prints",
                category: "Poster",
                mainImage: "images/jamc-poster.png?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 14.99,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 24,
                width: 18,
                height: 0.1,
                weight: 0.3,
                cost: 5.00,
                details: {
                    "Condition": "New",
                    "Material": "High-quality paper",
                    "Dimensions": "24 x 18 inches"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 6,
                name: "My Bloody Valentine - Loveless",
                shortDescription: "Seminal shoegaze album on CD",
                fullDescription: "My Bloody Valentine's 'Loveless' is a groundbreaking shoegaze album, originally released in 1991 by Creation Records. Known for its dense and ethereal soundscapes, it remains a staple in alternative music collections.",
                brand: "Creation Records",
                category: "CD",
                mainImage: "images/mbv-loveless-cd.jpeg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 19.99,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 5.5,
                width: 5,
                height: 0.4,
                weight: 0.2,
                cost: 10.00,
                details: {
                    "Release Year": "1991",
                    "Condition": "New",
                    "Format": "CD"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 7,
                name: "Yo La Tengo - I Can Hear the Heart Beating as One",
                shortDescription: "Classic indie rock album in MP3 format",
                fullDescription: "'I Can Hear the Heart Beating as One' by Yo La Tengo is a highly acclaimed indie rock album, released in 1997 under Matador Records. It blends elements of rock, pop, and experimental music, making it a quintessential release for the band.",
                brand: "Matador Records",
                category: "MP3",
                mainImage: "images/yo-la-tengo-you-can-hear-heart-beating-as-one-mp3.jpeg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 9.99,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 0,
                width: 0,
                height: 0,
                weight: 0,
                cost: 5.00,
                details: {
                    "Release Year": "1997",
                    "Condition": "New",
                    "Format": "MP3"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 8,
                name: "Sonic Youth T-Shirt",
                shortDescription: "Official Sonic Youth band T-shirt",
                fullDescription: "This Sonic Youth T-shirt features artwork inspired by the band's iconic album 'Washing Machine'. Made from 100% cotton, it’s perfect for fans of the legendary alternative rock band. Available in various sizes.",
                brand: "Geffen Records",
                category: "T-Shirt",
                mainImage: "images/sonic-youth-washing-machine-tshirt.jpeg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 19.99,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 12,
                width: 10,
                height: 1,
                weight: 0.3,
                cost: 8.00,
                details: {
                    "Material": "100% Cotton",
                    "Size": "Available in S, M, L, XL",
                    "Condition": "New"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 9,
                name: "Our Band Could Be Your Life",
                shortDescription: "A book chronicling the rise of indie bands in the '80s.",
                fullDescription: "Our Band Could Be Your Life: Scenes from the American Indie Underground 1981-1991 is a book by Michael Azerrad. It delves into the history and cultural impact of indie bands like Sonic Youth, The Replacements, and Hüsker Dü. A must-read for anyone interested in the roots of the indie music scene.",
                brand: "Indie Publishing",
                category: "Book",
                mainImage: "images/our-band-could-be-your-life-book.jpeg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 24.99,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 9,
                width: 6,
                height: 1.2,
                weight: 1.1,
                cost: 10.00,
                details: {
                    "Author": "Michael Azerrad",
                    "Publisher": "Indie Publishing",
                    "Release Year": "2001",
                    "Condition": "New",
                    "Pages": 528
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 10,
                name: "The Velvet Underground Poster",
                shortDescription: "Classic art print featuring The Velvet Underground.",
                fullDescription: "A high-quality poster of The Velvet Underground, perfect for fans of the influential rock band. It features a classic design that captures the essence of their iconic sound and style, ideal for any music lover's space.",
                brand: "Classic Prints",
                category: "Poster",
                mainImage: "images/velvet-underground-poster.jpeg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 19.99,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 24,
                width: 18,
                height: 0.1,
                weight: 0.3,
                cost: 8.00,
                details: {
                    "Condition": "New",
                    "Material": "Glossy Paper",
                    "Dimensions": "24 x 18 inches"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 11,
                name: "Audio-Technica ATH-M50x Headphones",
                shortDescription: "Professional studio monitor headphones",
                fullDescription: "The Audio-Technica ATH-M50x are critically acclaimed professional studio monitor headphones. Known for their exceptional clarity and comfort, they're perfect for both studio work and casual listening.",
                brand: "Audio-Technica",
                category: "Audio Equipment",
                mainImage: "/placeholder.svg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 149.00,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 11.4,
                width: 10,
                height: 4.1,
                weight: 0.6,
                cost: 80.00,
                details: {
                    "Driver Size": "45 mm",
                    "Frequency Response": "15 - 28,000 Hz",
                    "Impedance": "38 ohms"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 12,
                name: "Elton John - Goodbye Yellow Brick Road CD",
                shortDescription: "Classic Elton John album",
                fullDescription: "Goodbye Yellow Brick Road is the seventh studio album by Elton John, released in 1973. It is widely regarded as his best and most popular album.",
                brand: "MCA Records",
                category: "CDs",
                mainImage: "/placeholder.svg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 12.99,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 5.5,
                width: 4.9,
                height: 0.4,
                weight: 0.2,
                cost: 5.00,
                details: {
                    "Release Year": "1973",
                    "Number of Discs": "1",
                    "Total Length": "76:20"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 13,
                name: "Pearl Export Series 5-Piece Drum Set",
                shortDescription: "Complete drum kit for beginners and intermediates",
                fullDescription: "The Pearl Export Series is a high-quality, affordable drum set perfect for beginners and intermediate players. This 5-piece kit includes everything you need to start playing right away.",
                brand: "Pearl",
                category: "Musical Instruments",
                mainImage: "/placeholder.svg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 749.99,
                discountPercent: 5,
                enabled: true,
                inStock: true,
                length: 60,
                width: 48,
                height: 22,
                weight: 75,
                cost: 450.00,
                details: {
                    "Shell Material": "Poplar",
                    "Pieces": "5 (Bass Drum, Snare, 2 Toms, Floor Tom)",
                    "Cymbals Included": "Yes"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 14,
                name: "Nirvana - Nevermind Vinyl",
                shortDescription: "Iconic grunge album on vinyl",
                fullDescription: "Nevermind is the second studio album by American rock band Nirvana, released on September 24, 1991. It is Nirvana's best-known and most successful album, bringing alternative rock to the mainstream.",
                brand: "DGC Records",
                category: "Vinyl Records",
                mainImage: "/placeholder.svg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 24.99,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 12,
                width: 12,
                height: 0.2,
                weight: 0.5,
                cost: 12.00,
                details: {
                    "Release Year": "1991",
                    "Condition": "New",
                    "Speed": "33 1/3 RPM"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 15,
                name: "Focusrite Scarlett 2i2 Audio Interface",
                shortDescription: "USB audio interface for home recording",
                fullDescription: "The Focusrite Scarlett 2i2 is a popular USB audio interface perfect for home recording setups. It features two high-quality microphone preamps and is compatible with most DAW software.",
                brand: "Focusrite",
                category: "Audio Equipment",
                mainImage: "/placeholder.svg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 169.99,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 6.89,
                width: 3.89,
                height: 1.71,
                weight: 1.3,
                cost: 100.00,
                details: {
                    "Inputs": "2",
                    "Outputs": "2",
                    "Sample Rate": "Up to 192kHz"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 16,
                name: "Taylor Swift - 1989 Vinyl",
                shortDescription: "Taylor Swift's pop breakthrough on vinyl",
                fullDescription: "1989 is the fifth studio album by American singer-songwriter Taylor Swift, released on October 27, 2014. It marked Swift's transition from country to pop and became one of the best-selling albums of the 21st century.",
                brand: "Big Machine Records",
                category: "Vinyl Records",
                mainImage: "/placeholder.svg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 29.99,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 12,
                width: 12,
                height: 0.2,
                weight: 0.5,
                cost: 15.00,
                details: {
                    "Release Year": "2014",
                    "Condition": "New",
                    "Speed": "33 1/3 RPM"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 17,
                name: "Metallica T-Shirt",
                shortDescription: "Official Metallica band merchandise",
                fullDescription: "Show your love for the legendary metal band Metallica with this official merchandise t-shirt. Features the iconic Metallica logo on high-quality, comfortable fabric.",
                brand: "Metallica Official",
                category: "Apparel",
                mainImage: "/placeholder.svg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 24.99,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 28,
                width: 20,
                height: 1,
                weight: 0.3,
                cost: 10.00,
                details: {
                    "Material": "100% Cotton",
                    "Sizes Available": "S, M, L, XL, XXL",
                    "Care Instructions": "Machine wash cold"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 18,
                name: "Korg B2 Digital Piano",
                shortDescription: "Compact digital piano for beginners",
                fullDescription: "The Korg B2 is a compact digital piano perfect for beginners. It features 88 natural weighted hammer action keys, providing an authentic piano feel in a space-saving design.",
                brand: "Korg",
                category: "Musical Instruments",
                mainImage: "/placeholder.svg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 449.99,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 51.6,
                width: 13.2,
                height: 4.6,
                weight: 25.4,
                cost: 300.00,
                details: {
                    "Number of Keys": "88",
                    "Touch Sensitivity": "Natural Weighted Hammer Action",
                    "Polyphony": "120-note"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 19,
                name: "The Beatles - Sgt. Pepper's Lonely Hearts Club Band (Remastered) CD",
                shortDescription: "Remastered version of the iconic Beatles album",
                fullDescription: "Sgt. Pepper's Lonely Hearts Club Band is the eighth studio album by the English rock band the Beatles. Released in 1967, it was an immediate commercial and critical success, spending 27 weeks at the top of the UK albums chart and 15 weeks at number one in the US.",
                brand: "Apple Records",
                category: "CDs",
                mainImage: "/placeholder.svg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 14.99,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 5.5,
                width: 4.9,
                height: 0.4,
                weight: 0.2,
                cost: 5.00,
                details: {
                    "Release Year": "1967 (Remastered 2009)",
                    "Number of Tracks": "13",
                    "Total Length": "39:52"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 20,
                name: "Shure SM7B Vocal Dynamic Microphone",
                shortDescription: "Professional-grade vocal microphone",
                fullDescription: "The Shure SM7B is a dynamic microphone commonly used in professional recording and broadcasting. Known for its warm, smooth sound on vocal tracks, it's a favorite among podcasters and musicians alike.",
                brand: "Shure",
                category: "Audio Equipment",
                mainImage: "/placeholder.svg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 399.00,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 7.5,
                width: 4.3,
                height: 4.3,
                weight: 1.69,
                cost: 250.00,
                details: {
                    "Type": "Dynamic",
                    "Polar Pattern": "Cardioid",
                    "Frequency Response": "50 to 20,000 Hz"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 21,
                name: "Pink Floyd - The Dark Side of the Moon Vinyl",
                shortDescription: "Iconic Pink Floyd album on vinyl",
                fullDescription: "The Dark Side of the Moon is the eighth studio album by English rock band Pink Floyd, released on 1 March 1973. It built on ideas explored in earlier recordings and performances, and was marked by innovative production techniques.",
                brand: "Harvest Records",
                category: "Vinyl Records",
                mainImage: "/placeholder.svg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 29.99,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 12,
                width: 12,
                height: 0.2,
                weight: 0.5,
                cost: 15.00,
                details: {
                    "Release Year": "1973",
                    "Condition": "New",
                    "Speed": "33 1/3 RPM"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 22,
                name: "Yamaha FG800 Acoustic Guitar",
                shortDescription: "Entry-level acoustic guitar",
                fullDescription: "The Yamaha FG800 is a popular entry-level acoustic guitar known for its quality sound and construction. It features a solid spruce top, nato/okume back and sides, and a rosewood fingerboard.",
                brand: "Yamaha",
                category: "Musical Instruments",
                mainImage: "/placeholder.svg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 199.99,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 42.5,
                width: 20.7,
                height: 4.9,
                weight: 6.6,
                cost: 120.00,
                details: {
                    "Top Material": "Solid Spruce",
                    "Body Material": "Nato/Okume",
                    "Number of Strings": "6"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 23,
                name: "Adele - 21 (Digital Album)",
                shortDescription: "Adele's breakthrough album",
                fullDescription: "21 is the second studio album by English singer-songwriter Adele. It was released on 24 January 2011 in Europe and on 22 February 2011 in North America. The album was named after the age of the singer during its production.",
                brand: "XL Recordings",
                category: "Digital Downloads",
                mainImage: "/placeholder.svg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 9.99,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 0,
                width: 0,
                height: 0,
                weight: 0,
                cost: 2.00,
                details: {
                    "Release Year": "2011",
                    "Number of Tracks": "11",
                    "Total Length": "48:12"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 24,
                name: "The Real Book - Volume I (C Instruments)",
                shortDescription: "Essential jazz fake book",
                fullDescription: "The Real Book - Volume I (C Instruments) is a must-have for any serious jazz musician. It contains over 400 songs in fake book format, including melody, lyrics, and chord symbols for C instruments.",
                brand: "Hal Leonard",
                category: "Books",
                mainImage: "/placeholder.svg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 45.00,
                discountPercent: 10,
                enabled: true,
                inStock: true,
                length: 9,
                width: 5.5,
                height: 1.5,
                weight: 2.2,
                cost: 25.00,
                details: {
                    "Pages": "462",
                    "Edition": "6th",
                    "ISBN": "978-0634060380"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            },
            {
                id: 25,
                name: "Sennheiser HD 650 Open Back Professional Headphones",
                shortDescription: "High-end open back headphones",
                fullDescription: "The Sennheiser HD 650 are high-quality open back headphones designed for audiophiles and professional use. They offer exceptional sound quality with a wide, natural soundstage and comfortable fit for extended listening sessions.",
                brand: "Sennheiser",
                category: "Audio Equipment",
                mainImage: "/placeholder.svg?height=300&width=300",
                featuredImages: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
                listPrice: 399.95,
                discountPercent: 0,
                enabled: true,
                inStock: true,
                length: 12.4,
                width: 10,
                height: 4.3,
                weight: 0.57,
                cost: 250.00,
                details: {
                    "Type": "Open Back",
                    "Impedance": "300 ohms",
                    "Frequency Response": "10 - 41,000 Hz"
                },
                creationTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            }
        ];

        products = initialProducts;
        localStorage.setItem('products', JSON.stringify(products));
    }
}

// Admin function to reset products
function resetProductsToInitial() {
    if (confirm("Are you sure you want to reset the product list to its initial state? This will delete any custom products.")) {
        localStorage.removeItem('products');
        localStorage.removeItem('productDataVersion');
        initializeProducts();
        displayProducts(); // Assuming this function exists to refresh the product display
    }
}

function getUnsplashImage(width, height, category) {
    return `https://source.unsplash.com/random/${width}x${height}?${category}`;
}