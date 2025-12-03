// Базовое состояние SPA
const state = {
  lang: 'ru', // 'ru' или 'kz'
  currentPage: 'home', // 'home' | 'send' | 'about' | 'contacts' | 'faq'
  clientType: null, // 'FL' | 'UL' | 'SUPPLIER'
  selectedLocation: null, // { level1, level2, level3, level4, kato }
};

function createEmptyLocation() {
  return {
    level1: null,
    level2: null,
    level3: null,
    level4: null,
    kato: null,
  };
}

// Моки KATO для UX выбора населённого пункта.
// Здесь важно показать два типа веток:
// - обычная область с 4 уровнями,
// - город республиканского значения (Астана) с районами и без сельских округов/НП.

const MOCK_KATO = [
  {
    kato: '710000000',
    nameRu: 'Акмолинская область',
    nameKz: 'Ақмола облысы',
    children: [
      {
        kato: '710100000',
        nameRu: 'Бурабайский район',
        nameKz: 'Бурабай ауданы',
        children: [
          {
            kato: '710101000',
            nameRu: 'Катаркольский с/о',
            nameKz: 'Қатаркөл а/о',
            children: [
              {
                kato: '710101100',
                nameRu: 'с. Катарколь',
                nameKz: 'Қатаркөл ауылы',
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    kato: '710200000',
    nameRu: 'г. Астана',
    nameKz: 'Астана қаласы',
    children: [
      {
        kato: '710201000',
        nameRu: 'Алматинский район',
        nameKz: 'Алматы ауданы',
        children: [], // здесь НЕТ сельских округов и НП
      },
      {
        kato: '710202000',
        nameRu: 'Есильский район',
        nameKz: 'Есіл ауданы',
        children: [],
      },
    ],
  },
];

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
      return renderSend(texts);
    case 'about':
      return `<div class="page-placeholder">${texts.menu.about}</div>`;
    case 'contacts':
      return `<div class="page-placeholder">${texts.menu.contacts}</div>`;
    case 'faq':
      return `<div class="page-placeholder">${texts.menu.faq}</div>`;
    case 'input_account':
      // пока отрисовываем так же, позже заменим на полноценную страницу
      return `<div class="page-placeholder">${texts.menu.send}</div>`;
    case 'ul_identify':
      return `<div class="page-placeholder">${texts.menu.send}</div>`;
    case 'supplier_auth':
      return `<div class="page-placeholder">${texts.menu.send}</div>`;
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
