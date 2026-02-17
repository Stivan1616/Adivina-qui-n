const grid = document.getElementById("pokemonGrid");
const seedInput = document.getElementById("seedInput");
const btnLoad = document.getElementById("btnLoad");
const btnRandom = document.getElementById("btnRandom");
const currentSeedDisplay = document.getElementById("currentSeedDisplay");
const btnCopy = document.getElementById("btnCopy");
const btnUndo = document.getElementById("btnUndo");
const selectedPokemonCard = document.getElementById("selectedPokemonCard");
const bgMusic = document.getElementById("bgMusic");
const btnMusicToggle = document.getElementById("btnMusicToggle");

let allPokemonNames = [];
let currentSeed = null;
let gameState = "SELECTING"; // 'SELECTING' | 'PLAYING'
let moveHistory = [];
let isMusicPlaying = false;

// Initialize Audio Volume
bgMusic.volume = 0.1; // 10% volume as requested ("no suene tan fuerte")

// Seeded Random Generator (Mulberry32)
function mulberry32(a) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// Fetch all pokemon names only once
async function fetchPokemonData() {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
        const data = await response.json();
        allPokemonNames = data.results.map(p => p.name);

        // Initial load with random seed
        initGame(Math.floor(Math.random() * 1000000));
    } catch (error) {
        console.error("Error fetching Pokemon:", error);
        alert("Error cargando Pokémon. Intenta recargar la página.");
    }
}

function initGame(seed) {
    currentSeed = seed;
    currentSeedDisplay.textContent = `Seed: ${seed}`;
    seedInput.value = "";

    // Reset Game State
    gameState = "SELECTING";
    moveHistory = []; // Clear history
    selectedPokemonCard.innerHTML = '<div class="placeholder-text"><i class="ri-question-mark"></i></div>';
    selectedPokemonCard.className = "card placeholder-card";

    // Setup RNG
    const rng = mulberry32(seed);

    // Shuffle and pick 30
    // Fisher-Yates shuffle but using our seeded rng
    const shuffled = [...allPokemonNames];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selectedPokemons = shuffled.slice(0, 30);
    renderGrid(selectedPokemons);
}

function renderGrid(pokemons) {
    grid.innerHTML = "";
    pokemons.forEach(name => {
        const card = document.createElement("div");
        card.classList.add("card");

        const img = document.createElement("img");
        // Prefer pokemondb for consistency, fallback to official artwork if needed (names match usually)
        img.src = `https://img.pokemondb.net/artwork/large/${name}.jpg`;
        img.alt = name;
        img.loading = "lazy";

        // Add error handling for images
        img.onerror = function () {
            this.src = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png"; // Fallback placeholder
        };

        const label = document.createElement("div");
        label.classList.add("name");
        label.textContent = name.replace(/-/g, ' ');

        card.appendChild(img);
        card.appendChild(label);

        card.addEventListener("click", () => {
            if (gameState === "SELECTING") {
                selectPokemon(name);
            } else {
                // Track move for undo
                if (!card.classList.contains("defeated")) {
                    moveHistory.push(card);
                } else {
                    // If we are "undefeating" manually, should we track it? 
                    // Usually undo is for "I accidentally defeated this".
                    // Let's track all toggles or just defeats?
                    // User said "descarte mal", so usually they want to UNDO a defeat.
                    // If I click a defeated card to undefeat it, that's a manual correction.
                    // If I click a normal card to defeat it, that's a move.
                    // Let's just track the card element. simpler.
                    moveHistory.push(card);
                }
                card.classList.toggle("defeated");
            }
        });

        grid.appendChild(card);
    });
}

function selectPokemon(name) {
    gameState = "PLAYING";

    // Update Sidebar Card
    selectedPokemonCard.className = "card"; // Remove placeholder class
    selectedPokemonCard.innerHTML = ""; // Clear placeholder

    const img = document.createElement("img");
    img.src = `https://img.pokemondb.net/artwork/large/${name}.jpg`;
    img.alt = name;

    const label = document.createElement("div");
    label.classList.add("name");
    label.textContent = name.replace(/-/g, ' ').toUpperCase();

    selectedPokemonCard.appendChild(img);
    selectedPokemonCard.appendChild(label);
}

function undoLastMove() {
    if (moveHistory.length > 0) {
        const lastCard = moveHistory.pop();
        lastCard.classList.toggle("defeated");
    }
}

// Event Listeners
btnUndo.addEventListener('click', undoLastMove);

btnLoad.addEventListener('click', () => {
    const seed = parseInt(seedInput.value);
    if (!isNaN(seed)) {
        initGame(seed);
    } else {
        alert("Por favor ingresa un número válido como seed.");
    }
});

btnRandom.addEventListener('click', () => {
    initGame(Math.floor(Math.random() * 1000000));
});

btnCopy.addEventListener('click', () => {
    if (currentSeed !== null) {
        navigator.clipboard.writeText(currentSeed).then(() => {
            const icon = btnCopy.querySelector('i');
            const originalClass = icon.className;

            // Change to Check Icon
            icon.className = "ri-check-line";
            btnCopy.style.color = "#4caf50"; // Green color

            setTimeout(() => {
                icon.className = originalClass;
                btnCopy.style.color = ""; // Reset color
            }, 1500);
        });
    }
});

/* --- Music Player Logic --- */
const playlist = [
    "Audios/Littleroot Town Pokémon Omega Ruby Alpha Sapphire Music Extended HD.mp3",
    "Audios/furret walk full song 1 hora.mp3",
    "Audios/Que juego hizo Willyrex REMIX Dalas ft.Delox Christian Relikia.mp3",
    "Audios/QUÉ JUEGO HIZO WILLYREX 🗣️🗣️ Remix VERSION METAL🤘🏼 Shivita remix willyrex humor music.mp3"
];
let currentSongIndex = 0;
const volumeSlider = document.getElementById("volumeSlider");
const btnNextSong = document.getElementById("btnNextSong");

// Load initial song without playing yet (autoplay handles play)
bgMusic.src = playlist[currentSongIndex];

function toggleMusic() {
    if (bgMusic.paused) {
        playMusic();
    } else {
        pauseMusic();
    }
}

function playMusic() {
    bgMusic.play().then(() => {
        // Change icon to volume up
        btnMusicToggle.innerHTML = '<i class="ri-volume-up-fill"></i>';
        isMusicPlaying = true;
    }).catch(error => {
        console.error("Audio play failed:", error);
    });
}

function pauseMusic() {
    bgMusic.pause();
    // Change icon to volume mute
    btnMusicToggle.innerHTML = '<i class="ri-volume-mute-fill"></i>';
    isMusicPlaying = false;
}

function playNextSong() {
    currentSongIndex = (currentSongIndex + 1) % playlist.length;
    bgMusic.src = playlist[currentSongIndex];
    if (isMusicPlaying) {
        playMusic();
    } else {
        // If it was paused, load next but stay paused? 
        // Typically "Next" implies "Play Next".
        playMusic();
    }
}

// Controls Events
btnMusicToggle.addEventListener('click', toggleMusic);

volumeSlider.addEventListener('input', (e) => {
    bgMusic.volume = e.target.value;
});

btnNextSong.addEventListener('click', playNextSong);

// Auto-play next song when ended
bgMusic.addEventListener('ended', playNextSong);

// Initial Autoplay
playMusic();

// Start Game Data
fetchPokemonData();
