const books = [
    {
        id: 1,
        title: "The Midnight Library",
        author: "Matt Haig",
        cover: "https://res.cloudinary.com/dbelkcsrq/image/upload/book-store/covers/The-Midnight-Library.jpg",
        description: "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.",
        link: "https://res.cloudinary.com/dbelkcsrq/image/upload/book-store/books/Yousef-Hany.pdf"
    },
    {
        id: 2,
        title: "Dune",
        author: "Frank Herbert",
        cover: "https://res.cloudinary.com/dbelkcsrq/image/upload/book-store/covers/Dune.jpg",
        description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the 'spice'.",
        link: "https://res.cloudinary.com/dbelkcsrq/image/upload/book-store/books/Yousef-Hany.pdf"
    },
    {
        id: 3,
        title: "Project Hail Mary",
        author: "Andy Weir",
        cover: "https://res.cloudinary.com/dbelkcsrq/image/upload/book-store/covers/Project-Hail-Mary.jpg",
        description: "Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the earth itself will perish. Except that right now, he doesn't know that.",
        link: "https://res.cloudinary.com/dbelkcsrq/image/upload/book-store/books/Yousef-Hany.pdf"
    },
    {
        id: 4,
        title: "Klara and the Sun",
        author: "Kazuo Ishiguro",
        cover: "https://res.cloudinary.com/dbelkcsrq/image/upload/book-store/covers/Klara-and-the-Sun.jpg",
        description: "A novel that looks at our changing world through the eyes of an unforgettable narrator, and one that explores the fundamental question: what does it mean to love?",
        link: "https://res.cloudinary.com/dbelkcsrq/image/upload/book-store/books/Yousef-Hany.pdf"
    },
    {
        id: 5,
        title: "Atomic Habits",
        author: "James Clear",
        cover: "https://res.cloudinary.com/dbelkcsrq/image/upload/book-store/covers/Atomic-Habits.jpg",
        description: "An easy and proven way to build good habits and break bad ones. It offers a framework for improving every day, regardless of your goals.",
        link: "https://res.cloudinary.com/dbelkcsrq/image/upload/book-store/books/Yousef-Hany.pdf"
    },
    {
        id: 6,
        title: "The Silent Patient",
        author: "Alex Michaelides",
        cover: "https://res.cloudinary.com/dbelkcsrq/image/upload/book-store/covers/The-Silent-Patient.jpg",
        description: "A shocking psychological thriller of a woman's act of violence against her husband—and of the therapist obsessed with uncovering her motive.",
        link: "https://res.cloudinary.com/dbelkcsrq/image/upload/book-store/books/Yousef-Hany.pdf"
    }
];


const bookGrid = document.getElementById('bookGrid');
const modal = document.getElementById('bookModal');
const closeModalBtn = document.getElementById('closeModalBtn');

function displayBooks() {
    bookGrid.innerHTML = '';
    books.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.dataset.bookId = book.id;

        card.innerHTML = `
                        <div class="book-card__cover">
                            <img src="${book.cover}" alt="${book.title} cover" onerror="this.onerror=null; this.src='./images/book-placeholder.png';">
                        </div>
                        <div class="book-card__info">
                            <h3 class="book-card__title">${book.title}</h3>
                            <p class="book-card__author">${book.author}</p>
                        </div>
                    `;
        bookGrid.appendChild(card);
    });
}

function openModal(book) {
    document.getElementById('modalBookCover').src = book.cover;
    document.getElementById('modalBookTitle').textContent = book.title;
    document.getElementById('modalBookAuthor').textContent = book.author;
    document.getElementById('modalBookDescription').textContent = book.description;
    document.getElementById('modalDirectLink').href = book.link;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

bookGrid.addEventListener('click', (event) => {
    const card = event.target.closest('.book-card');
    if (card) {
        const bookId = card.dataset.bookId;
        const selectedBook = books.find(book => book.id == bookId);
        if (selectedBook) {
            openModal(selectedBook);
        }
    }
});

closeModalBtn.addEventListener('click', closeModal);

modal.addEventListener('click', (event) => {
    if (event.target === modal) {
        closeModal();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeModal();
    }
});


displayBooks();