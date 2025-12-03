// Базовое состояние SPA
const state = {
  lang: 'ru', // 'ru' или 'kz'
  currentPage: 'home', // 'home' | 'send' | 'about' | 'contacts' | 'faq'
  clientType: null, // 'FL' | 'UL' | 'SUPPLIER'
};

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  render();
});

// Настройка шапки: меню + языки + бургер
function initHeader() {
  const navButtons = document.querySelectorAll('.nav-link');
  const langButtons = document.querySelectorAll('.lang-btn');
  const burger = document.getElementById('burger');

  // Навигация по меню
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const page = btn.getAttribute('data-page');
      state.currentPage = page;
      render();
      closeMobileMenu();
    });
  });

  // Переключение языка
  langButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      if (!ABONENT_TEXTS[lang]) return;
      state.lang = lang;
      render();
    });
  });

  // Бургер-меню
  if (burger) {
    burger.addEventListener('click', () => {
      document.body.classList.toggle('menu-open');
    });
  }
}

function closeMobileMenu() {
  document.body.classList.remove('menu-open');
}

// Главный рендер
function render() {
  const root = document.getElementById('app');
  if (!root) return;

  const texts = ABONENT_TEXTS[state.lang] || ABONENT_TEXTS.ru;

  renderHeaderTexts(texts);
  root.innerHTML = renderPageContent(texts);
}

// Обновляем подписи в шапке (меню + активный язык)
function renderHeaderTexts(texts) {
  const navMap = {
    home: texts.menu.home,
    send: texts.menu.send,
    about: texts.menu.about,
    contacts: texts.menu.contacts,
    faq: texts.menu.faq,
  };

  document.querySelectorAll('.nav-link').forEach((btn) => {
    const page = btn.getAttribute('data-page');
    btn.textContent = navMap[page] || '';
    btn.classList.toggle('active', state.currentPage === page);
  });

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    const lang = btn.getAttribute('data-lang');
    btn.classList.toggle('active', state.lang === lang);
  });
}

// Контент страниц
function renderPageContent(texts) {
  switch (state.currentPage) {
    case 'home':
      return renderHome(texts);
    case 'send':
      // На этом этапе — только заглушка с заголовком из меню.
      return `<div class="page-placeholder">${texts.menu.send}</div>`;
    case 'about':
      return `<div class="page-placeholder">${texts.menu.about}</div>`;
    case 'contacts':
      return `<div class="page-placeholder">${texts.menu.contacts}</div>`;
    case 'faq':
      return `<div class="page-placeholder">${texts.menu.faq}</div>`;
    default:
      return renderHome(texts);
  }
}

// Главная страница с тремя вертикальными кнопками
function renderHome(texts) {
  const btns = texts.home.buttons;
  return `
    <section class="home-layout">
      <div class="home-intro">
        ${texts.home.intro}
      </div>
      <div class="home-buttons">
        <button class="home-btn" data-client-type="FL" type="button">
          ${btns.fl}
        </button>
        <button class="home-btn" data-client-type="UL" type="button">
          ${btns.ul}
        </button>
        <button class="home-btn" data-client-type="SUPPLIER" type="button">
          ${btns.supplier}
        </button>
      </div>
    </section>
  `;
}

// Делегируем клики по кнопкам главной (ФЛ / ЮЛ / Поставщик)
document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const clientType = target.getAttribute('data-client-type');
  if (!clientType) return;

  state.clientType = clientType; // 'FL' | 'UL' | 'SUPPLIER'
  state.currentPage = 'send';
  render();
  closeMobileMenu();
});
