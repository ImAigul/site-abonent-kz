// ========== БАЗОВОЕ СОСТОЯНИЕ ==========

// Базовый URL для API Worker.
const API_BASE_URL = 'https://abonent-kz.alimova-aygul.workers.dev';

const state = {
  lang: 'ru',
  currentPage: 'home',
  clientType: null,
  selectedLocation: null,
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
        children: [],
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

function findNodeByKato(nodes, kato) {
  if (!kato) return null;
  return (nodes || []).find((n) => n.kato === kato) || null;
}

function getDisplayName(node) {
  return state.lang === 'kz' ? node.nameKz : node.nameRu;
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  render();
});

// ========== ШАПКА ==========

function initHeader() {
  const navButtons = document.querySelectorAll('.nav-link');
  const langButtons = document.querySelectorAll('.lang-btn');
  const burger = document.getElementById('burger');

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

  langButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      if (!ABONENT_TEXTS[lang]) return;
      state.lang = lang;
      render();
    });
  });

  if (burger) {
    burger.addEventListener('click', () => {
      document.body.classList.toggle('menu-open');
    });
  }
}

function closeMobileMenu() {
  document.body.classList.remove('menu-open');
}

// ========== РЕНДЕР ==========

function render() {
  const root = document.getElementById('app');
  const texts = ABONENT_TEXTS[state.lang] || ABONENT_TEXTS.ru;

  renderHeaderTexts(texts);
  root.innerHTML = renderPageContent(texts);
}

function renderHeaderTexts(texts) {
  const map = {
    home: texts.menu.home,
    send: texts.menu.send,
    about: texts.menu.about,
    contacts: texts.menu.contacts,
    faq: texts.menu.faq,
  };

  document.querySelectorAll('.nav-link').forEach((btn) => {
    const page = btn.getAttribute('data-page');
    btn.textContent = map[page] || '';
    btn.classList.toggle('active', state.currentPage === page);
  });

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', state.lang === btn.getAttribute('data-lang'));
  });
}

// ========== СТРАНИЦЫ ==========

function renderPageContent(texts) {
  switch (state.currentPage) {
    case 'home':
      return renderHome(texts);
    case 'send':
      return renderSend(texts);
    case 'input_account':
      return renderInputAccount(texts);
    case 'choose_service':
      return `<div class="page-placeholder">${texts.menu.send}</div>`;
    case 'about':
      return `<div class="page-placeholder">${texts.menu.about}</div>`;
    case 'contacts':
      return `<div class="page-placeholder">${texts.menu.contacts}</div>`;
    case 'faq':
      return `<div class="page-placeholder">${texts.menu.faq}</div>`;
    case 'ul_identify':
      return `<div class="page-placeholder">${texts.menu.send}</div>`;
    case 'supplier_auth':
      return `<div class="page-placeholder">${texts.menu.send}</div>`;
    default:
      return renderHome(texts);
  }
}

// ---- HOME ----

function renderHome(texts) {
  const b = texts.home.buttons;

  return `
    <section class="home-layout">
      <div class="home-intro">${texts.home.intro}</div>
      <div class="home-buttons">
        <button class="home-btn" data-client-type="FL">${b.fl}</button>
        <button class="home-btn" data-client-type="UL">${b.ul}</button>
        <button class="home-btn" data-client-type="SUPPLIER">${b.supplier}</button>
      </div>
    </section>
  `;
}

// ---- SEND ----

function renderSend(texts) {
  if (!state.selectedLocation) state.selectedLocation = createEmptyLocation();
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
  if (level4Node) leafNode = level4Node;
  else if (level3Node && level3Nodes.length === 0) leafNode = level3Node;
  else if (level2Node && level2Nodes.length === 0) leafNode = level2Node;
  else if (level1Node && level1Nodes.length === 0) leafNode = level1Node;

  const isContinueEnabled = !!leafNode;
  const t = texts.send;

  const renderOptions = (nodes, selected) =>
    `<option value=""></option>` +
    nodes
      .map(
        (n) =>
          `<option value="${n.kato}" ${
            n.kato === selected ? 'selected' : ''
          }>${getDisplayName(n)}</option>`
      )
      .join('');

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
        <button id="send-continue-btn" class="primary-btn" ${
          isContinueEnabled ? '' : 'disabled'
        }>
          ${t.continue}
        </button>
      </div>
    </section>
  `;
}

// ---- INPUT ACCOUNT ----

function renderInputAccount(texts) {
  const t = texts.inputAccount;

  return `
    <section class="send-layout">
      <div class="form-field">
        <label class="form-label" for="account-input">${t.title}</label>
        <input id="account-input" type="text" class="form-select" autocomplete="off" />
        <p class="account-warning">${t.warning}</p>
        <p id="account-error" class="account-error" style="display:none;"></p>
      </div>

      <div class="send-actions">
        <button id="account-check-btn" class="primary-btn">${t.button}</button>
      </div>
    </section>
  `;
}

// ========== СОБЫТИЯ ==========

document.addEventListener('click', (event) => {
  const target = event.target;

  const type = target.getAttribute('data-client-type');
  if (type) {
    state.clientType = type;
    state.selectedLocation = createEmptyLocation();
    state.currentPage = 'send';
    render();
    return;
  }

  if (target.id === 'send-continue-btn') {
    handleSendContinue();
    return;
  }

  if (target.id === 'account-check-btn') {
    handleAccountCheck();
    return;
  }
});

document.addEventListener('change', (event) => {
  const target = event.target;

  if (!(target instanceof HTMLSelectElement)) return;
  if (!target.classList.contains('form-select')) return;

  const level = Number(target.getAttribute('data-level'));
  const value = target.value || null;

  if (!state.selectedLocation) state.selectedLocation = createEmptyLocation();
  const loc = state.selectedLocation;

  if (level === 1) {
    loc.level1 = value;
    loc.level2 = null;
    loc.level3 = null;
    loc.level4 = null;
    loc.kato = null;
  } else if (level === 2) {
    loc.level2 = value;
    loc.level3 = null;
    loc.level4 = null;
    loc.kato = null;
  } else if (level === 3) {
    loc.level3 = value;
    loc.level4 = null;
    loc.kato = null;
  } else if (level === 4) {
    loc.level4 = value;
    loc.kato = null;
  }

  render();
});

// ========== CONTINUE LOGIC ==========

function handleSendContinue() {
  const loc = state.selectedLocation;

  const n1 = findNodeByKato(MOCK_KATO, loc.level1);
  const n2 = findNodeByKato(n1?.children || [], loc.level2);
  const n3 = findNodeByKato(n2?.children || [], loc.level3);
  const n4 = findNodeByKato(n3?.children || [], loc.level4);

  let leaf = null;
  if (n4) leaf = n4;
  else if (n3 && n3.children.length === 0) leaf = n3;
  else if (n2 && n2.children.length === 0) leaf = n2;
  else if (n1 && n1.children.length === 0) leaf = n1;

  if (!leaf) return;

  loc.kato = leaf.kato;

  if (state.clientType === 'FL') state.currentPage = 'input_account';
  else if (state.clientType === 'UL') state.currentPage = 'ul_identify';
  else if (state.clientType === 'SUPPLIER') state.currentPage = 'supplier_auth';
  else state.currentPage = 'input_account';

  render();
}

// ========== API CHECK ACCOUNT ==========

async function handleAccountCheck() {
  const input = document.getElementById('account-input');
  const error = document.getElementById('account-error');

  const account = input.value.trim();
  const kato = state.selectedLocation?.kato;
  const clientType = state.clientType;

  const texts = ABONENT_TEXTS[state.lang].inputAccount;

  error.style.display = 'none';
  error.textContent = '';

  if (!account || !kato) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/check-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account, kato, clientType }),
    });

    const data = await res.json();

    if (data.found) {
      state.currentPage = 'choose_service';
      render();
    } else {
      error.textContent = texts.errorNotFound;
      error.style.display = 'block';
    }
  } catch (e) {
    console.error('Ошибка при запросе /api/check-account', e);
  }
}
