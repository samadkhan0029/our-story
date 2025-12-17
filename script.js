// --- 1. DATA CONFIGURATION ---
const storyData = {
    home: {
        title: "Our Story",
        chapters: [
            { id: 'beginning', title: "The Beginning", desc: "Where It All Started. August 2023 marked the start of something beautiful. Two souls crossing paths..." },
            { id: 'friendship', title: "Friendship", desc: "Building Our Foundation. Before love, there was friendship. Late night talks, shared secrets..." },
            { id: 'love', title: "Love", desc: "When Everything Changed. The moment friendship became something more. Butterflies, stolen glances..." },
            { id: 'storms', title: "Storms & Peace", desc: "Growing Through It All. Not every day was sunshine. We faced storms, bad fights, but found our way back." },
            { id: 'special', title: "Special Moments", desc: "The Little Things. It's not always the big moments that matter. Sometimes it's the quiet Tuesdays..." }
        ]
    },
    chapters: {
        beginning: {
            title: "The Beginning",
            subtitle: "Where It All Started",
            next: "friendship",
            prev: "home",
            memories: [
                { id: 'h1', type: 'photo', title: "The Day We Met", date: "August 17, 2023", desc: "Some moments change everything. This was one of them." },
                { id: 'h2', type: 'note', title: "First Conversations", date: "September 2023", desc: "Hours felt like minutes when we talked." }
            ]
        },
        friendship: {
            title: "Friendship",
            subtitle: "Building Our Foundation",
            next: "love",
            prev: "beginning",
            memories: [
                { id: 'h3', type: 'photo', title: "Inside Jokes Begin", date: "November 2023", desc: "The kind of laughter only we understood." },
                { id: 'h4', type: 'photo', title: "Holiday Season Together", date: "December 2023", desc: "The first of many seasons we'd share." },
                { id: 'h5', type: 'photo', title: "New Year, Same Us", date: "January 2024", desc: "Starting the year with you felt right." },
                { id: 'h6', type: 'note', title: "Best Friends", date: "February 2024", desc: "You became my person without me even realizing." }
            ]
        },
        love: {
            title: "Love",
            subtitle: "When Everything Changed",
            next: "storms",
            prev: "friendship",
            memories: [
                { id: 'h7', type: 'photo', title: "The Realization", date: "March 2024", desc: "When I knew it was more than friendship." },
                { id: 'h8', type: 'photo', title: "Summer Love", date: "June 2024", desc: "Golden days and endless possibilities." },
                { id: 'h9', type: 'note', title: "One Year Since We Met", date: "August 2024", desc: "365 days of you. Every single one worth it." }
            ]
        },
        storms: {
            title: "Storms & Peace",
            subtitle: "Growing Through It All",
            next: "special",
            prev: "love",
            memories: [
                { id: 'h10', type: 'note', title: "Understanding Each Other", date: "February 2025", desc: "We learned to listen, truly listen." },
                { id: 'h11', type: 'note', title: "Stronger Together", date: "May 2025", desc: "Every storm made our roots grow deeper." }
            ]
        },
        special: {
            title: "Special Moments",
            subtitle: "The Little Things",
            next: "home",
            prev: "storms",
            memories: [
                { id: 'h12', type: 'photo', title: "Movie Nights", date: "Random dates", desc: "Cozy blankets, bad movies, perfect company." },
                { id: 'h13', type: 'photo', title: "Food Adventures", date: "Always", desc: "Trying new places, sharing bites, making memories." },
                { id: 'h14', type: 'note', title: "Late Night Talks", date: "Always", desc: "3AM conversations about everything and nothing." },
                { id: 'h15', type: 'photo', title: "The Little Things", date: "Daily", desc: "Good morning texts, random memes, 'thinking of you'." }
            ]
        }
    }
};

// --- 2. GLOBAL VARIABLES ---
let currentChapterId = 'home';
let selectedType = 'photo';

// Elements
const app = document.getElementById('app');
const loginOverlay = document.getElementById('login-overlay');
const loginBtn = document.getElementById('login-btn');
const passwordInput = document.getElementById('password-input');
const errorMessage = document.getElementById('error-message');
const mainInterface = document.getElementById('main-interface');
const modal = document.getElementById('memory-modal');
const closeModal = document.querySelector('.close-modal');
const closeModalBtn = document.querySelector('.close-modal-btn');
const saveBtn = document.getElementById('save-memory-btn');
const popup = document.getElementById('image-popup');
const popupImg = document.getElementById('popup-img');


// --- 3. LOGIN LOGIC ---
function attemptLogin() {
    const code = passwordInput.value;
    if (code === "2629") {
        loginOverlay.style.opacity = '0';
        setTimeout(() => {
            loginOverlay.style.display = 'none';
            mainInterface.style.display = 'block';
            renderHome();
        }, 500);
    } else {
        errorMessage.style.display = 'block';
        passwordInput.classList.add('shake');
        setTimeout(() => {
            passwordInput.classList.remove('shake');
        }, 500);
    }
}

loginBtn.addEventListener('click', attemptLogin);
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') attemptLogin();
});


// --- 4. INDEXED DB SETUP (For Large Files) ---
const DB_NAME = 'OurStoryDB';
const DB_VERSION = 1;
const STORE_NAME = 'memories';
const DELETED_STORE = 'deleted_ids';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(DELETED_STORE)) {
                db.createObjectStore(DELETED_STORE, { keyPath: 'id' });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

async function addMemoryDB(memory) {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(memory);
    return new Promise((resolve) => {
        tx.oncomplete = () => resolve();
    });
}

async function getMemoriesDB() {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    return new Promise((resolve) => {
        const request = tx.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result || []);
    });
}

// --- UPDATED DELETE FUNCTION ---
async function deleteMemoryDB(id) {
    const db = await openDB();
    const tx = db.transaction([STORE_NAME, DELETED_STORE], 'readwrite');
    
    // Only try to delete from "STORE_NAME" if it is a NUMBER (a new memory)
    // "isNaN(id)" checks if it is NOT a number (like "h1")
    if (!isNaN(id)) {
        tx.objectStore(STORE_NAME).delete(Number(id)); 
    }
    
    // ALWAYS add to the "Deleted List" (so hardcoded memories stay hidden)
    tx.objectStore(DELETED_STORE).put({ id: id });
    
    return new Promise((resolve) => {
        tx.oncomplete = () => resolve();
    });
}

async function getDeletedIdsDB() {
    const db = await openDB();
    const tx = db.transaction(DELETED_STORE, 'readonly');
    return new Promise((resolve) => {
        const request = tx.objectStore(DELETED_STORE).getAll();
        request.onsuccess = () => resolve(request.result.map(item => item.id) || []);
    });
}


// --- 5. MEMORY ACTIONS ---

// Global Delete Function
window.deleteMemory = async function(id) {
    if(confirm("Are you sure you want to remove this memory?")) {
        await deleteMemoryDB(id);
        renderChapter(currentChapterId); // Re-render after delete
    }
};

saveBtn.addEventListener('click', async () => {
    const title = document.getElementById('mem-title').value;
    const date = document.getElementById('mem-date').value; 
    const desc = document.getElementById('mem-desc').value;
    const fileInput = document.getElementById('mem-file');
    
    if (!title) {
        alert("Please provide at least a Title.");
        return;
    }
    
    saveBtn.innerText = "Saving...";
    saveBtn.disabled = true;

    try {
        const newMemory = {
            id: Date.now(),
            chapterId: currentChapterId,
            type: selectedType,
            title: title,
            date: date,
            desc: desc,
            media: null 
        };

        const processFile = () => {
            return new Promise((resolve, reject) => {
                if ((selectedType === 'photo' || selectedType === 'video') && fileInput.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = (e) => reject(e);
                    reader.readAsDataURL(fileInput.files[0]);
                } else {
                    resolve(null);
                }
            });
        };

        newMemory.media = await processFile();
        await addMemoryDB(newMemory);
        
        closeModalFunc();
        await renderChapter(currentChapterId);
        
    } catch (e) {
        console.error(e);
        alert("Error saving memory. The file might be corrupted.");
    } finally {
        saveBtn.innerText = "Add Memory";
        saveBtn.disabled = false;
    }
});

window.selectType = function(type) {
    selectedType = type;
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
    
    const buttons = document.querySelectorAll('.type-btn');
    if(type === 'photo') buttons[0].classList.add('active');
    if(type === 'video') buttons[1].classList.add('active');
    if(type === 'note') buttons[2].classList.add('active');

    const fileGroup = document.getElementById('media-input-group');
    if (type === 'note') {
        fileGroup.style.display = 'none';
    } else {
        fileGroup.style.display = 'block';
    }
};


// --- 6. RENDERING ---

function renderHome() {
    currentChapterId = 'home';
    window.scrollTo(0, 0);
    app.innerHTML = `
        <section class="hero fade-in">
            <h1 class="hero-title">Our Story</h1>
            <p class="hero-subtitle">A journey of friendship, love, and everything in between</p>
            <i class="fa-solid fa-heart heart-icon"></i>
            <p class="hero-text">From the moment we met to the memories we continue to make. Every laugh, every tear, every fight, and every moment of peace — they all led us here.</p>
            <button class="btn-primary" onclick="loadChapter('beginning')">Begin Our Journey</button>
        </section>

        <section class="chapters-section fade-in">
            <div class="section-header">
                <h2>Our Chapters</h2>
                <p>Every great love story has its chapters. Here are ours.</p>
            </div>
            <div class="grid">
                ${storyData.home.chapters.map(chapter => `
                    <div class="chapter-card" onclick="loadChapter('${chapter.id}')">
                        <h3>${chapter.title}</h3>
                        <p>${chapter.desc}</p>
                    </div>
                `).join('')}
            </div>
        </section>
    `;
    updateActiveNav('home');
}

async function renderChapter(chapterId) {
    currentChapterId = chapterId;
    window.scrollTo(0, 0);
    const data = storyData.chapters[chapterId];
    
    // Fetch from DB (Async)
    const dbMemories = await getMemoriesDB();
    const localMemories = dbMemories.filter(mem => mem.chapterId === chapterId);
    const deletedIds = await getDeletedIdsDB();
    
    let allMemories = [...data.memories, ...localMemories];
    
    // Filter deleted items by checking both strings and numbers
    // We convert deletedIds to string to ensure matching works for both 'h1' and '173...'
    const deletedSet = new Set(deletedIds.map(String));
    allMemories = allMemories.filter(m => !deletedSet.has(String(m.id)));

    const nextLabel = data.next === 'home' ? 'Home' : storyData.chapters[data.next].title;
    const prevLabel = data.prev === 'home' ? 'Home' : storyData.chapters[data.prev].title;

    app.innerHTML = `
        <section class="chapter-hero fade-in">
            <h1>${data.title}</h1>
            <i class="fa-solid fa-heart heart-icon" style="font-size: 1rem; margin: 1rem 0;"></i>
            <h2>${data.subtitle}</h2>
        </section>

        <section class="chapter-memories fade-in">
            <div class="memory-header">
                <h3>Memories</h3>
                <p>Moments that made this chapter special</p>
            </div>

            <div class="grid">
                ${allMemories.map(mem => createMemoryCard(mem)).join('')}
            </div>

            <div class="add-memory-container">
                <button class="btn-outline" onclick="openModal()">
                    <i class="fa-solid fa-plus"></i> Add a memory to this chapter
                </button>
            </div>

            <div class="chapter-nav">
                <div class="nav-item" onclick="loadChapter('${data.prev === 'home' ? 'home' : data.prev}')">
                    Previous
                    <strong>${prevLabel}</strong>
                </div>
                <div class="nav-item" style="text-align: right;" onclick="loadChapter('${data.next}')">
                    Next
                    <strong>${nextLabel}</strong>
                </div>
            </div>
        </section>
    `;
    updateActiveNav(chapterId);
}


// --- 7. MEMORY CARD GENERATOR ---

function createMemoryCard(mem) {
    let mediaContent = '';
    let clickAction = ''; 

    if (mem.media) {
        if (mem.type === 'video') {
            // Pointer events auto for video controls
            mediaContent = `
                <div class="media-preview" style="pointer-events: auto;">
                    <video controls src="${mem.media}" style="width:100%; height:100%; object-fit:contain;"></video>
                </div>`;
            clickAction = ''; 
        } else {
            mediaContent = `
                <div class="media-preview">
                    <img src="${mem.media}" alt="${mem.title}">
                </div>`;
            clickAction = `onclick="openPopup('${mem.media}')"`;
        }
    } else {
        const icon = mem.type === 'photo' ? 'fa-regular fa-image' : 'fa-regular fa-note-sticky';
        mediaContent = `<div class="memory-icon"><i class="${icon}"></i></div>`;
    }

    const dateHtml = mem.date ? `
        <div class="memory-date">
            <i class="fa-regular fa-calendar"></i> ${mem.date}
        </div>
    ` : '';

    return `
        <div class="memory-card" ${clickAction}>
            ${dateHtml}
            ${mediaContent}
            <h4>${mem.title}</h4>
            <p>${mem.desc}</p>
            <button class="btn-remove" onclick="event.stopPropagation(); deleteMemory('${mem.id}')">Remove Memory</button>
        </div>
    `;
}


// --- 8. NAVIGATION & POPUPS ---

window.loadChapter = async function(id) {
    if (id === 'home') {
        renderHome();
    } else {
        await renderChapter(id);
    }
}

function updateActiveNav(id) {
    document.querySelectorAll('.nav-links li').forEach(li => {
        li.classList.remove('active');
        if (li.dataset.target === id) {
            li.classList.add('active');
        }
    });
}

window.openPopup = function(src) {
    if(!src || src === 'undefined') return;
    popupImg.src = src;
    popup.classList.add('active');
    document.body.style.overflow = 'hidden';
}

window.closePopup = function() {
    popup.classList.remove('active');
    setTimeout(() => {
        popupImg.src = '';
    }, 300); 
    document.body.style.overflow = 'auto';
}


// --- 9. LISTENERS ---

// Mobile Menu
const mobileBtn = document.querySelector('.nav-mobile-toggle');
const navLinks = document.querySelector('.nav-links');

mobileBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

document.querySelectorAll('.nav-links li').forEach(li => {
    li.addEventListener('click', () => {
        loadChapter(li.dataset.target);
        navLinks.classList.remove('active');
    });
});

const navLogo = document.querySelector('.nav-logo');
navLogo.addEventListener('click', () => {
    loadChapter('home');
    navLinks.classList.remove('active');
});

window.openModal = function() {
    document.getElementById('mem-title').value = '';
    document.getElementById('mem-date').value = '';
    document.getElementById('mem-desc').value = '';
    document.getElementById('mem-file').value = '';
    modal.classList.add('active');
}

function closeModalFunc() {
    modal.classList.remove('active');
}

closeModal.addEventListener('click', closeModalFunc);
closeModalBtn.addEventListener('click', closeModalFunc);

window.addEventListener('click', (e) => {
    if (e.target === modal) closeModalFunc();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popup.classList.contains('active')) {
        closePopup();
    }
});