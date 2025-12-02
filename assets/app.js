// ------------------------------
// Глобальное состояние
// ------------------------------
let LANG = 'kk'; // по умолчанию казахский

function getTexts() {
  return window.TEXTS[LANG] || window.TEXTS.kk;
}

// ------------------------------
// Рендер шапки (меню)
// ------------------------------
function renderHeader() {
  const t = getTexts();
  const header = document.getElementById('site-header');

  header.innerHTML = `
    <div class="nav">
      <div class="nav-logo">Abonent.kz</div>
      <nav class="nav-menu">
        <button class="nav-link" data-page="home">${t.menu_home}</button>
        <button class="nav-link" data-page="send">${t.menu_send}</button>
        <button class="nav-link" data-page="about">${t.menu_about}</button>
        <button class="nav-link" data-page="contacts">${t.menu_contacts}</button>
        <button class="nav-link" data-page="help">${t.menu_help}</button>
      </nav>
      <div class="nav-lang">
        <button class="lang-btn" data-lang="kk" ${LANG === 'kk' ? 'data-active="1"' : ''}>KAZ</button>
        <button class="lang-btn" data-lang="ru" ${LANG === 'ru' ? 'data-active="1"' : ''}>RUS</button>
      </div>
    </div>
  `;

  // обработка кликов по меню
  header.querySelectorAll('.nav-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.getAttribute('data-page');
      navigate(page);
    });
  });

  // переключение языка
  header.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const newLang = btn.getAttribute('data-lang');
      if (newLang !== LANG) {
        LANG = newLang;
        renderHeader();
        // перерисовываем текущую страницу
        const hash = window.location.hash.replace('#', '') || 'home';
        render(hash);
      }
    });
  });
}

// ------------------------------
// Роутер
// ------------------------------
function navigate(page) {
  window.location.hash = page;
  render(page);
}

function render(page) {
  const t = getTexts();
  const app = document.getElementById('app');

  if (page === 'home' || page === '') {
    app.innerHTML = `
      <section class="page page-home">
        <h1>${t.home_title}</h1>
        <p>${t.home_desc}</p>
      </section>
    `;
  } else {
    app.innerHTML = `
      <section class="page">
        <h1>В разработке</h1>
        <p>Эта страница ещё не подключена.</p>
      </section>
    `;
  }
}

// ------------------------------
// Инициализация
// ------------------------------
window.addEventListener('load', () => {
  renderHeader();
  const initialPage = window.location.hash.replace('#', '') || 'home';
  render(initialPage);
});
