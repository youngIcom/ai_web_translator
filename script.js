// --- 1. SELEKSI ELEMEN DARI HTML ---
const inputBox = document.getElementById('input-box');
const outputBox = document.getElementById('output-box');
const swapBtn = document.getElementById('swap-btn');
const charCount = document.getElementById('char-count');
const copyBtn = document.getElementById('copy-btn');
const listenInputBtn = document.getElementById('listen-input-btn');
const listenOutputBtn = document.getElementById('listen-output-btn');
const sourceSelector = document.getElementById('source-selector');
const targetSelector = document.getElementById('target-selector');

// --- 2. PENGATURAN STATE & KONFIGURASI ---
let sourceLang = 'indonesia';
let targetLang = 'inggris';
const API_ENDPOINT = 'http://127.0.0.1:8000/api/chat';

// --- 3. FUNGSI-FUNGSI UTAMA ---

/**
 * FUNGSI BARU: Memperbarui tampilan tombol bahasa.
 * Fungsi ini akan memberi kelas 'active' pada tombol yang sesuai
 * dengan state sourceLang dan targetLang saat ini.
 */
function updateLanguageUI() {
    // Perbarui tombol sumber
    for (const button of sourceSelector.children) {
        button.classList.toggle('active', button.dataset.lang === sourceLang);
    }
    // Perbarui tombol target
    for (const button of targetSelector.children) {
        button.classList.toggle('active', button.dataset.lang === targetLang);
    }
}

async function getChatReply(text) {
    if (text.trim() === '') {
        outputBox.value = '';
        return;
    }
    outputBox.value = "sedang diterjemahkan";
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'Gagal mendapatkan respon.');
        }
        outputBox.value = data.reply || 'Tidak ada balasan.';
    } catch (error) {
        console.error('Error:', error);
        outputBox.value = `Terjadi kesalahan: ${error.message}`;
    }
}

function debounce(func, delay = 800) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

function updateCharCount() {
    const currentLength = inputBox.value.length;
    charCount.textContent = `${currentLength} / 5000`;
}

/**
 * FUNGSI MODIFIKASI: Sekarang juga memanggil updateLanguageUI().
 */
function swapLanguages() {
    const tempText = inputBox.value;
    inputBox.value = outputBox.value;
    outputBox.value = tempText;

    [sourceLang, targetLang] = [targetLang, sourceLang];
    
    // Panggil fungsi untuk perbarui UI tombol setelah bahasa ditukar
    updateLanguageUI();
    updateCharCount();
}

function copyToClipboard() {
    const textToCopy = outputBox.value;
    if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i>';
            }, 2000);
        }).catch(err => console.error('Gagal menyalin teks: ', err));
    }
}

function speakText(text, lang) {
    if (!text || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = lang === 'indonesia' ? 'id-ID' : 'en-US';
    utterance.lang = langCode;
    window.speechSynthesis.speak(utterance);
}

// --- 4. EVENT LISTENERS ---
inputBox.addEventListener('keyup', debounce(event => getChatReply(event.target.value)));
inputBox.addEventListener('input', updateCharCount);
swapBtn.addEventListener('click', swapLanguages);
copyBtn.addEventListener('click', copyToClipboard);
listenInputBtn.addEventListener('click', () => speakText(inputBox.value, sourceLang));
listenOutputBtn.addEventListener('click', () => speakText(outputBox.value, targetLang));

// BARU: Menambahkan fungsi pada tombol pilih bahasa
sourceSelector.addEventListener('click', (e) => {
    if (e.target.classList.contains('lang-btn')) {
        sourceLang = e.target.dataset.lang;
        targetLang = sourceLang === 'indonesia' ? 'inggris' : 'indonesia';
        updateLanguageUI();
        getChatReply(inputBox.value); // Langsung terjemahkan ulang
    }
});

targetSelector.addEventListener('click', (e) => {
    if (e.target.classList.contains('lang-btn')) {
        targetLang = e.target.dataset.lang;
        sourceLang = targetLang === 'indonesia' ? 'inggris' : 'indonesia';
        updateLanguageUI();
        getChatReply(inputBox.value); // Langsung terjemahkan ulang
    }
});


// --- 5. INISIALISASI ---
// Panggil fungsi untuk mengatur tampilan awal saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    updateCharCount();
    updateLanguageUI();
});
