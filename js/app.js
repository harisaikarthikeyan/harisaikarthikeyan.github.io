document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadBooks();
    loadNotes();
});

function initNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('.section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);

            // Update Nav State
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Update Section State
            sections.forEach(s => {
                s.classList.remove('active');
                if (s.id === targetId) {
                    s.classList.add('active');
                }
            });
        });
    });
}

// Google Books API Key
const GOOGLE_BOOKS_API_KEY = 'AIzaSyCzmKLeBRQmqmskllgtZSMCdE8GE37zqcA';

async function loadBooks() {
    const container = document.getElementById('books-container');
    if (!container) return;

    if (typeof booksData === 'undefined' || !Array.isArray(booksData)) {
        console.error('booksData is missing');
        container.innerHTML = '<p>Unable to load bookshelf data.</p>';
        return;
    }

    if (booksData.length === 0) {
        container.innerHTML = '<p>No books currently on the shelf.</p>';
        return;
    }

    // 1. Initial Render with Placeholders
    const booksHTML = booksData.map((book, index) => createBookCardHTML(book, index)).join('');
    container.innerHTML = `<div class="books-grid">${booksHTML}</div>`;

    // 2. Fetch Covers Asynchronously
    booksData.forEach(async (book, index) => {
        if (book.isbn) {
            try {
                const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${book.isbn}&key=${GOOGLE_BOOKS_API_KEY}`);
                const data = await response.json();

                if (data.items && data.items.length > 0) {
                    const volumeInfo = data.items[0].volumeInfo;
                    const imageLinks = volumeInfo.imageLinks;

                    if (imageLinks && imageLinks.thumbnail) {
                        // High-res fix: replace zoom=1 with zoom=0 or remove it
                        let imageUrl = imageLinks.thumbnail.replace('http:', 'https:').replace('&edge=curl', '');

                        // Update the img src in the DOM
                        const imgElement = document.getElementById(`book-img-${index}`);
                        if (imgElement) {
                            imgElement.src = imageUrl;
                        }
                    }
                }
            } catch (error) {
                console.error(`Error fetching cover for ${book.title}:`, error);
            }
        }
    });
}

function createBookCardHTML(book, index) {
    // Placeholder image while loading
    // Using a simple gray SVG placeholder
    const placeholder = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'300\' viewBox=\'0 0 200 300\'%3E%3Crect width=\'200\' height=\'300\' fill=\'%23eee\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23aaa\'%3ELoading...%3C/text%3E%3C/svg%3E';

    // Check if review exists or use placeholder
    const review = book.review ? `"${book.review}"` : '';

    return `
        <div class="book-card">
            <img id="book-img-${index}" src="${placeholder}" alt="${book.title}" class="book-cover" loading="lazy">
            <div class="book-overlay">
                <h3>${book.title}</h3>
                <p>${book.author}</p>
                <div class="review-text">${review}</div>
            </div>
        </div>
    `;
}

function loadNotes() {
    const container = document.getElementById('notes-container');
    if (!container) return;

    if (typeof notesData === 'undefined' || !Array.isArray(notesData)) {
        // Fallback to the link card if no local notes found (or keep both)
        return;
    }

    if (notesData.length === 0) return;

    // Clear the container (removes the notion link placeholder if we want to replace it entirely, 
    // OR we can append. User asked to "organize it directly". 
    // I will replace the default content with the detailed list.)

    const notesHTML = notesData.map(note => `
        <article class="note-entry" id="${note.id}">
            <h2>${note.title}</h2>
            <div class="note-meta">${note.date}</div>
            <div class="note-content">
                ${note.content}
            </div>
        </article>
    `).join('');

    container.innerHTML = notesHTML;
}
