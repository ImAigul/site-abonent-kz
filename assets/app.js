// ========== БАЗОВОЕ СОСТОЯНИЕ ==========

const state = {
  lang: 'ru', // 'ru' или 'kz'
  currentPage: 'home', // 'home' | 'send' | 'about' | 'contacts' | 'faq' | ...
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

// ========== МОКИ KATO ==========
// Пример дерева:
// - обычная область с 4 уровнями,
// - город респ. значения (Астана) с районами и без 3–4 уровня.

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
        children: [], // нет сельских округов и НП
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

// Вспомогательные функции для KATO

function findNodeByKato(nodes, kato) {
  if (!kato) return null;
  return (nodes || []).find((n) => n.kato === kato) || null;
}

function getDisplayName(node) {
  if (!node) return '';
  return state.lang === 'kz' ? node.nameKz : node.nameRu;
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  render();
});

// ========== ШАПКА (МЕНЮ + ЯЗЫКИ + БУРГЕР) ==========

function initHeader() {
  const navButtons = document.querySelectorAll('.nav-link');
  const langButtons = document.querySelectorAll('.lang-btn');
  const burger = document.getElementById('burger');

  // Навигация по меню
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const page = btn.getAttribute('data-page');
      state.currentPage = page;

      if (page === 'send' && !state.selectedLocation) {
        state.selectedLocation = createEmptyLocation();
      }

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

// ========== ГЛАВНЫЙ РЕНДЕР ==========

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

// ========== РЕНДЕР СТРАНИЦ ==========

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

// Страница выбора населённого пункта (send)
function renderSend(texts) {
  if (!state.selectedLocation) {
    state.selectedLocation = createEmptyLocation();
  }
  const loc = state.selectedLocation;

  const level1Nodes = MOCK_KATO;
  const level1Node = findNodeByKato(level1Nodes, loc.level1);

  const level2Nodes = level1Node?.children || [];
  const level2Node = findNodeByKato(level2Nodes, loc.level2);

  const level3Nodes = level2Node?.children || [];
  const level3Node = findNodeByKato(level3Nodes, loc.level3);

  const level4Nodes = level3Node?.children || [];
  const level4Node = findNodeByKato(level4Nodes, loc.level4);

  // Листовой узел: последний выбранный уровень, у которого нет детей.
  let leafNode = null;
  if (level4Node) {
    leafNode = level4Node;
  } else if (level3Node && (!level3Node.children || level3Node.children.length === 0)) {
    leafNode = level3Node;
  } else if (level2Node && (!level2Node.children || level2Node.children.length === 0)) {
    leafNode = level2Node;
  } else if (level1Node && (!level1Node.children || level1Node.children.length === 0)) {
    leafNode = level1Node;
  }

  const isContinueEnabled = !!leafNode;

  const t = texts.send;

  const renderOptions = (nodes, selectedKato) =>
    [
      '<option value=""></option>',
      ...nodes.map(
        (n) =>
          `<option value="${n.kato}" ${
            n.kato === selectedKato ? 'selected' : ''
          }>${getDisplayName(n)}</option>`
      ),
    ].join('');

  return `
    <section class="send-layout">
      <div class="send-grid">
        <div class="form-field">
          <label class="form-label">${t.level1Title}</label>
          <select class="form-select" data-level="1">
            ${renderOptions(level1Nodes, loc.level1)}
          </select>
        </div>

        <div class="form-field">
          <label class="form-label">${t.level2Title}</label>
          <select class="form-select" data-level="2" ${
            level2Nodes.length ? '' : 'disabled'
          }>
            ${renderOptions(level2Nodes, loc.level2)}
          </select>
        </div>

        <div class="form-field">
          <label class="form-label">${t.level3Title}</label>
          <select class="form-select" data-level="3" ${
            level3Nodes.length ? '' : 'disabled'
          }>
            ${renderOptions(level3Nodes, loc.level3)}
          </select>
        </div>

        <div class="form-field">
          <label class="form-label">${t.level4Title}</label>
          <select class="form-select" data-level="4" ${
            level4Nodes.length ? '' : 'disabled'
          }>
            ${renderOptions(level4Nodes, loc.level4)}
          </select>
        </div>
      </div>

      <div class="send-actions">
        <button
          id="send-continue-btn"
          class="primary-btn"
          type="button"
          ${isContinueEnabled ? '' : 'disabled'}
        >
          ${t.continue}
        </button>
      </div>
    </section>
  `;
}

// ========== ОБРАБОТКА СОБЫТИЙ ==========

// Делегируем клики по кнопкам главной (ФЛ / ЮЛ / Поставщик)
// и по кнопке "Продолжить" на странице send
document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  // Кнопки выбора типа клиента на главной
  const clientType = target.getAttribute('data-client-type');
  if (clientType) {
    state.clientType = clientType; // 'FL' | 'UL' | 'SUPPLIER'
    state.selectedLocation = createEmptyLocation();
    state.currentPage = 'send';
    render();
    closeMobileMenu();
    return;
  }

  // Кнопка "Продолжить" на странице send
  if (target.id === 'send-continue-btn') {
    handleSendContinue();
    return;
  }
});

// Изменения в селектах KATO
document.addEventListener('change', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) return;
  if (!target.classList.contains('form-select')) return;

  const levelStr = target.getAttribute('data-level');
  const level = levelStr ? parseInt(levelStr, 10) : NaN;
  if (!level || level < 1 || level > 4) return;

  const value = target.value || null;
  updateSelectedLocation(level, value);
  render();
});

function updateSelectedLocation(level, kato) {
  if (!state.selectedLocation) {
    state.selectedLocation = createEmptyLocation();
  }
  const loc = state.selectedLocation;

  switch (level) {
    case 1:
      loc.level1 = kato;
      loc.level2 = null;
      loc.level3 = null;
      loc.level4 = null;
      loc.kato = null;
      break;
    case 2:
      loc.level2 = kato;
      loc.level3 = null;
      loc.level4 = null;
      loc.kato = null;
      break;
    case 3:
      loc.level3 = kato;
      loc.level4 = null;
      loc.kato = null;
      break;
    case 4:
      loc.level4 = kato;
      loc.kato = null;
      break;
    default:
      break;
  }
}

function handleSendContinue() {
  if (!state.selectedLocation) return;

  const loc = state.selectedLocation;

  const level1Nodes = MOCK_KATO;
  const level1Node = findNodeByKato(level1Nodes, loc.level1);

  const level2Nodes = level1Node?.children || [];
  const level2Node = findNodeByKato(level2Nodes, loc.level2);

  const level3Nodes = level2Node?.children || [];
  const level3Node = findNodeByKato(level3Nodes, loc.level3);

  const level4Nodes = level3Node?.children || [];
  const level4Node = findNodeByKato(level4Nodes, loc.level4);

  let leafNode = null;
  if (level4Node) {
    leafNode = level4Node;
  } else if (level3Node && (!level3Node.children || level3Node.children.length === 0)) {
    leafNode = level3Node;
  } else if (level2Node && (!level2Node.children || level2Node.children.length === 0)) {
    leafNode = level2Node;
  } else if (level1Node && (!level1Node.children || level1Node.children.length === 0)) {
    leafNode = level1Node;
  }

  if (!leafNode) {
    return;
  }

  loc.kato = leafNode.kato;

  if (state.clientType === 'FL') {
    state.currentPage = 'input_account';
  } else if (state.clientType === 'UL') {
    state.currentPage = 'ul_identify';
  } else if (state.clientType === 'SUPPLIER') {
    state.currentPage = 'supplier_auth';
  } else {
    // если зашли через меню без выбора типа — просто заглушка
    state.currentPage = 'input_account';
  }

  render();
}
