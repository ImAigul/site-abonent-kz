// ------------------------------
// GLOBAL STATE
// ------------------------------
let LANG = 'kk';   // по умолчанию казахский

// Чтение текстов из конфигурации
function t(key) {
    return TEXTS[LANG][key] || key;
}

// ------------------------------
// SIMPLE ROUTER
// ------------------------------
function navigate(page) {
    window.location.hash = page;
    render(page);
}

function render(page) {
    const app = document.getElementById("app");

    if (page === 'home') {
        app.innerHTML = `
            <h1>${t('home_title')}</h1>
            <p>${t('home_desc')}</p>
        `;
    } else {
        app.innerHTML = `<p>404</p>`;
    }
}

// ------------------------------
// INITIALIZATION
// ------------------------------
window.addEventListener("load", () => {
    render('home');
});
