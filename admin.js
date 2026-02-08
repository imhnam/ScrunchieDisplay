// Admin Logic for Tiệm Scrunchie
// Uses Supabase for authentication, database, and storage

// ============================================
// State
// ============================================
let currentUser = null;
let currentCollection = null;
let collections = [];

// ============================================
// DOM Elements
// ============================================
const loginScreen = document.getElementById('login-screen');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const userEmailSpan = document.getElementById('user-email');

const collectionsGrid = document.getElementById('collections-grid');
const collectionsLoading = document.getElementById('collections-loading');
const addCollectionBtn = document.getElementById('add-collection-btn');

const collectionModal = document.getElementById('collection-modal');
const collectionForm = document.getElementById('collection-form');
const modalTitle = document.getElementById('modal-title');
const closeModalBtn = document.getElementById('close-modal');
const deleteCollectionBtn = document.getElementById('delete-collection-btn');
const imagesGrid = document.getElementById('images-grid');
const imageUpload = document.getElementById('image-upload');
const uploadProgress = document.getElementById('upload-progress');
const progressBar = document.getElementById('progress-bar');

const settingsForm = document.getElementById('settings-form');

// ============================================
// Authentication
// ============================================
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    loginScreen.classList.remove('hidden');
    adminDashboard.classList.add('hidden');
}

function showDashboard() {
    loginScreen.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
    userEmailSpan.textContent = currentUser.email;
    loadCollections();
    loadSettings();
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    loginError.classList.add('hidden');

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        loginError.textContent = error.message;
        loginError.classList.remove('hidden');
        return;
    }

    currentUser = data.user;
    showDashboard();
});

logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    currentUser = null;
    showLogin();
});

// ============================================
// Collections CRUD
// ============================================
async function loadCollections() {
    collectionsLoading.classList.remove('hidden');
    collectionsGrid.innerHTML = '';

    const { data, error } = await supabaseClient
        .from('collections')
        .select('*')
        .order('display_order');

    collectionsLoading.classList.add('hidden');

    if (error) {
        console.error('Error loading collections:', error);
        collectionsGrid.innerHTML = `
            <div class="col-span-full text-center py-8 text-gray-500">
                <p>Chưa có dữ liệu. Hãy tạo tables trong Supabase trước.</p>
                <p class="text-sm mt-2">Xem hướng dẫn trong implementation_plan.md</p>
            </div>
        `;
        return;
    }

    collections = data || [];

    if (collections.length === 0) {
        collectionsGrid.innerHTML = `
            <div class="col-span-full text-center py-8 text-gray-500">
                <p>Chưa có bộ sưu tập nào.</p>
                <p class="text-sm mt-2">Bấm "Thêm bộ sưu tập" để bắt đầu.</p>
            </div>
        `;
        return;
    }

    collections.forEach(collection => {
        collectionsGrid.innerHTML += renderCollectionCard(collection);
    });

    // Add click handlers
    document.querySelectorAll('.edit-collection').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.key;
            openEditModal(key);
        });
    });
}

function renderCollectionCard(collection) {
    return `
        <div class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition group">
            <div class="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                ${collection.cover_image
            ? `<img src="${collection.cover_image}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />`
            : `<div class="w-full h-full flex items-center justify-center text-gray-400">
                        <span class="material-symbols-outlined text-5xl">image</span>
                       </div>`
        }
                ${collection.badge_text
            ? `<span class="absolute top-3 left-3 bg-${collection.badge_color || 'green-500'} text-white text-xs font-bold px-2 py-1 rounded">${collection.badge_text}</span>`
            : ''
        }
            </div>
            <div class="p-4">
                <h3 class="font-bold text-gray-800">${collection.title}</h3>
                <p class="text-sm text-gray-500 mt-1 line-clamp-2">${collection.description || 'Không có mô tả'}</p>
                <div class="flex justify-between items-center mt-4">
                    <span class="text-xs text-gray-400">Key: ${collection.key}</span>
                    <button class="edit-collection text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1" data-key="${collection.key}">
                        <span class="material-symbols-outlined text-lg">edit</span>
                        Chỉnh sửa
                    </button>
                </div>
            </div>
        </div>
    `;
}

addCollectionBtn.addEventListener('click', () => {
    currentCollection = null;
    modalTitle.textContent = 'Thêm bộ sưu tập mới';
    collectionForm.reset();
    imagesGrid.innerHTML = '';
    deleteCollectionBtn.classList.add('hidden');
    collectionModal.classList.remove('hidden');
});

async function openEditModal(key) {
    const collection = collections.find(c => c.key === key);
    if (!collection) return;

    currentCollection = collection;
    modalTitle.textContent = 'Chỉnh sửa: ' + collection.title;
    deleteCollectionBtn.classList.remove('hidden');

    // Fill form
    collectionForm.elements.id.value = collection.id;
    collectionForm.elements.key.value = collection.key;
    collectionForm.elements.title.value = collection.title;
    collectionForm.elements.description.value = collection.description || '';
    collectionForm.elements.badge_text.value = collection.badge_text || '';
    collectionForm.elements.badge_color.value = collection.badge_color || '';

    // Load images
    await loadCollectionImages(collection.key);

    collectionModal.classList.remove('hidden');
}

async function loadCollectionImages(collectionKey) {
    imagesGrid.innerHTML = '<div class="col-span-4 text-center py-4 text-gray-400 text-sm">Đang tải...</div>';

    const { data, error } = await supabaseClient
        .from('collection_images')
        .select('*')
        .eq('collection_key', collectionKey)
        .order('display_order');

    if (error) {
        imagesGrid.innerHTML = '<div class="col-span-4 text-center py-4 text-red-500 text-sm">Lỗi khi tải ảnh</div>';
        return;
    }

    if (!data || data.length === 0) {
        imagesGrid.innerHTML = '<div class="col-span-4 text-center py-4 text-gray-400 text-sm">Chưa có ảnh nào</div>';
        return;
    }

    imagesGrid.innerHTML = data.map(img => `
        <div class="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img src="${img.image_url}" class="w-full h-full object-cover" />
            <button type="button" class="delete-image absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center" data-id="${img.id}" data-url="${img.image_url}">
                <span class="material-symbols-outlined text-sm">close</span>
            </button>
        </div>
    `).join('');

    // Add delete handlers
    document.querySelectorAll('.delete-image').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm('Xóa ảnh này?')) return;
            await deleteImage(btn.dataset.id, btn.dataset.url);
        });
    });
}

closeModalBtn.addEventListener('click', () => {
    collectionModal.classList.add('hidden');
    currentCollection = null;
});

collectionModal.addEventListener('click', (e) => {
    if (e.target === collectionModal) {
        collectionModal.classList.add('hidden');
        currentCollection = null;
    }
});

collectionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(collectionForm);
    const data = {
        key: formData.get('key'),
        title: formData.get('title'),
        description: formData.get('description'),
        badge_text: formData.get('badge_text'),
        badge_color: formData.get('badge_color'),
    };

    const id = formData.get('id');

    if (id) {
        // Update
        const { error } = await supabaseClient
            .from('collections')
            .update(data)
            .eq('id', id);

        if (error) {
            alert('Lỗi: ' + error.message);
            return;
        }
    } else {
        // Insert
        const { error } = await supabaseClient
            .from('collections')
            .insert(data);

        if (error) {
            alert('Lỗi: ' + error.message);
            return;
        }
    }

    collectionModal.classList.add('hidden');
    loadCollections();
});

deleteCollectionBtn.addEventListener('click', async () => {
    if (!currentCollection) return;
    if (!confirm(`Xóa bộ sưu tập "${currentCollection.title}"? Hành động này không thể hoàn tác.`)) return;

    // Delete all images first
    const { data: images } = await supabaseClient
        .from('collection_images')
        .select('image_url')
        .eq('collection_key', currentCollection.key);

    if (images) {
        for (const img of images) {
            await deleteFromStorage(img.image_url);
        }
    }

    await supabaseClient
        .from('collection_images')
        .delete()
        .eq('collection_key', currentCollection.key);

    // Delete collection
    const { error } = await supabaseClient
        .from('collections')
        .delete()
        .eq('key', currentCollection.key);

    if (error) {
        alert('Lỗi: ' + error.message);
        return;
    }

    collectionModal.classList.add('hidden');
    loadCollections();
});

// ============================================
// Image Upload
// ============================================
imageUpload.addEventListener('change', async (e) => {
    if (!currentCollection) {
        alert('Vui lòng lưu bộ sưu tập trước khi thêm ảnh.');
        return;
    }

    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    uploadProgress.classList.remove('hidden');
    let uploaded = 0;

    for (const file of files) {
        const fileName = `${currentCollection.key}/${Date.now()}_${file.name}`;

        const { data, error } = await supabaseClient.storage
            .from('scrunchie-images')
            .upload(fileName, file);

        if (error) {
            console.error('Upload error:', error);
            continue;
        }

        // Get public URL
        const { data: urlData } = supabaseClient.storage
            .from('scrunchie-images')
            .getPublicUrl(fileName);

        // Save to database
        await supabaseClient
            .from('collection_images')
            .insert({
                collection_key: currentCollection.key,
                image_url: urlData.publicUrl
            });

        uploaded++;
        progressBar.style.width = `${(uploaded / files.length) * 100}%`;
    }

    uploadProgress.classList.add('hidden');
    progressBar.style.width = '0%';
    imageUpload.value = '';

    // Reload images
    await loadCollectionImages(currentCollection.key);

    // Update cover image if first upload
    if (!currentCollection.cover_image) {
        const { data: firstImage } = await supabaseClient
            .from('collection_images')
            .select('image_url')
            .eq('collection_key', currentCollection.key)
            .order('display_order')
            .limit(1)
            .single();

        if (firstImage) {
            await supabaseClient
                .from('collections')
                .update({ cover_image: firstImage.image_url })
                .eq('key', currentCollection.key);
        }
    }
});

async function deleteImage(id, url) {
    // Delete from storage
    await deleteFromStorage(url);

    // Delete from database
    const { error } = await supabaseClient
        .from('collection_images')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Lỗi: ' + error.message);
        return;
    }

    // Reload images
    if (currentCollection) {
        await loadCollectionImages(currentCollection.key);
    }
}

async function deleteFromStorage(url) {
    try {
        const path = url.split('/scrunchie-images/')[1];
        if (path) {
            await supabaseClient.storage
                .from('scrunchie-images')
                .remove([path]);
        }
    } catch (e) {
        console.error('Error deleting from storage:', e);
    }
}

// ============================================
// Settings
// ============================================
async function loadSettings() {
    const { data } = await supabaseClient
        .from('site_settings')
        .select('*');

    if (data) {
        data.forEach(setting => {
            const input = settingsForm.elements[setting.key];
            if (input) input.value = setting.value;
        });
    }
}

settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(settingsForm);

    for (const [key, value] of formData.entries()) {
        await supabaseClient
            .from('site_settings')
            .upsert({ key, value, updated_at: new Date().toISOString() });
    }

    alert('Đã lưu cài đặt!');
});

// ============================================
// Tabs
// ============================================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active state
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active', 'text-green-600', 'border-b-2', 'border-green-500');
            b.classList.add('text-gray-500');
        });
        btn.classList.add('active', 'text-green-600', 'border-b-2', 'border-green-500');
        btn.classList.remove('text-gray-500');

        // Show tab content
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
        document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
    });
});

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', checkAuth);
