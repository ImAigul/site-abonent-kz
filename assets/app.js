// ===============================
// Глобальное состояние
// ===============================
let LANG = (typeof localStorage !== "undefined" && localStorage.getItem("abonent_lang")) || "kk";
let CURRENT_PAGE = "home";
let CLIENT_TYPE = null; // "FL" | "UL" | "SUPPLIER" | null

let SELECTED_LOCATION = {
  level1: null,
  level2: null,
  level3: null,
  level4: null,
  kato: null
};

// Моки KATO (пример структуры для UX)
const MOCK_KATO = [
  {
    code: "710000000",
    name_kk: "Астана қ.",
    name_ru: "г. Астана",
    children: [
      {
        code: "710100000",
        name_kk: "Алматинский ауданы",
        name_ru: "Алматинский район"
        // без children — лист, достаточно уровня 2
      },
      {
        code: "710200000",
        name_kk: "Есіл ауданы",
        name_ru: "Есильский район"
      }
    ]
  },
  {
    code: "750000000",
    name_kk: "Алматы қ.",
    name_ru: "г. Алматы",
    children: [
      {
        code: "750100000",
        name_kk: "Әуезов ауданы",
        name_ru: "Ауэзовский район"
      },
      {
        code: "750200000",
        name_kk: "Бостандық ауданы",
        name_ru: "Бостандыкский район"
      }
    ]
  },
  {
    code: "110000000",
    name_kk: "Ақмола облысы",
    name_ru: "Акмолинская область",
    children: [
      {
        code: "111000000",
        name_kk: "Целиноград ауданы",
        name_ru: "Целиноградский район",
        children: [
          {
            code: "111051000",
            name_kk: "Қосшы қ.",
            name_ru: "г. Косшы"
          }
        ]
      }
    ]
  }
];

// ===============================
// Хелперы
// ===============================

// Получаем тексты для текущего языка
function t() {
  return window.TEXTS[LANG];
}

function saveLang() {
  try {
    localStorage.setItem("abonent_lang", LANG);
  } catch (e) {
    // молча игнорируем
  }
}

function findKatoNode(code) {
  if (!code) return null;

  const stack = [...MOCK_KATO].map(n => ({ node: n, level: 1 }));
  while (stack.length) {
    const { node, level } = stack.pop();
    if (node.code === code) return { node, level };
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        stack.push({ node: child, level: level + 1 });
      }
    }
  }
  return null;
}

function getSelectedKatoNode() {
  const code =
    SELECTED_LOCATION.level4 ||
    SELECTED_LOCATION.level3 ||
    SELECTED_LOCATION.level2 ||
    SELECTED_LOCATION.level1;

  if (!code) return null;
  return findKatoNode(code);
}

// ===============================
// Рендер шапки (меню)
// ===============================
function renderHeader() {
  const header = document.getElementById("site-header");
  const tx = t();

  header.innerHTML = `
    <div class="nav">
      <div class="nav-logo">Abonent.kz</div>

      <nav class="nav-menu">
        <button class="nav-link" data-page="home">${tx.menu_home}</button>
        <button class="nav-link" data-page="send">${tx.menu_send}</button>
        <button class="nav-link" data-page="about">${tx.menu_about}</button>
        <button class="nav-link" data-page="contacts">${tx.menu_contacts}</button>
        <button class="nav-link" data-page="help">${tx.menu_help}</button>
      </nav>

      <div class="nav-lang">
        <button class="lang-btn" data-lang="kk" ${LANG === "kk" ? 'data-active="1"' : ""}>KAZ</button>
        <button class="lang-btn" data-lang="ru" ${LANG === "ru" ? 'data-active="1"' : ""}>RUS</button>
      </div>
    </div>
  `;

  // Слушатели меню
  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.onclick = () => {
      const page = btn.dataset.page;
      CURRENT_PAGE = page;

      // если пользователь кликает "Передать показания" из меню,
      // а тип ещё не выбран — по умолчанию считаем ФЛ
      if (page === "send" && !CLIENT_TYPE) {
        CLIENT_TYPE = "FL";
      }

      renderPage();
    };
  });

  // Слушатели смены языка
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.onclick = () => {
      LANG = btn.dataset.lang;
      saveLang();
      renderHeader();
      renderPage();
    };
  });
}

// ===============================
// Рендер конкретных страниц
// ===============================

function renderHome(page) {
  const tx = t();

  page.innerHTML = `
    <section class="home-hero">
      <h1 class="home-hero-title">${tx.home_title}</h1>
      <p class="home-hero-subtitle">${tx.home_subtitle}</p>

      <div class="home-buttons">
        <button class="home-btn" data-client-type="FL">
          ${tx.home_fl_btn}
        </button>
        <button class="home-btn home-btn--ul" data-client-type="UL">
          ${tx.home_ul_btn}
        </button>
        <button class="home-btn home-btn--supplier" data-client-type="SUPPLIER">
          ${tx.home_supplier_btn}
        </button>
      </div>
    </section>
  `;

  page.querySelectorAll(".home-btn").forEach(btn => {
    btn.onclick = () => {
      CLIENT_TYPE = btn.dataset.clientType;
      CURRENT_PAGE = "send";
      renderPage();
    };
  });
}

function renderSend(page) {
  const tx = t();

  page.innerHTML = `
    <h1>${tx.send_title}</h1>
    <p>${tx.send_desc}</p>

    <section class="card">
      <h2 class="card-title">${tx.send_step_location_title}</h2>
      <p class="card-hint">${tx.send_step_location_hint}</p>

      <div class="form-grid">
        <div class="form-field">
          <label for="region-select">${tx.send_region_label}</label>
          <select id="region-select" class="form-select" disabled>
            <option value="">— ... —</option>
          </select>
        </div>

        <div class="form-field">
          <label for="district-select">${tx.send_district_label}</label>
          <select id="district-select" class="form-select" disabled>
            <option value="">— ... —</option>
          </select>
        </div>

        <div class="form-field">
          <label for="locality-select">${tx.send_locality_label}</label>
          <select id="locality-select" class="form-select" disabled>
            <option value="">— ... —</option>
          </select>
        </div>
      </div>

      <div class="form-actions">
        <button id="send-location-continue" class="btn-primary" disabled>
          ${tx.send_continue_btn}
        </button>
      </div>
    </section>
  `;

  initSendPage();
}

function renderInputAccount(page) {
  const tx = t();

  page.innerHTML = `
    <section class="account-page">
      <h1 class="account-title">${tx.input_account_title}</h1>

      <div class="account-field">
        <input
          id="account-input"
          class="account-input"
          type="text"
        />
        <p class="account-warning">${tx.input_account_warning}</p>
      </div>

      <div class="account-actions">
        <button class="btn-primary" id="account-check-btn">
          ${tx.input_account_button}
        </button>
      </div>
    </section>
  `;

  // Логика проверки ЛС и запросов к Worker будет добавлена на следующем этапе
}

function renderSimplePage(page, title, desc) {
  page.innerHTML = `
    <h1>${title || ""}</h1>
    <p>${desc || ""}</p>
  `;
}

// ===============================
// Логика страницы send (KATO)
// ===============================
function initSendPage() {
  const regionSelect   = document.getElementById("region-select");
  const districtSelect = document.getElementById("district-select");
  const localitySelect = document.getElementById("locality-select");
  const btnContinue    = document.getElementById("send-location-continue");

  if (!regionSelect || !districtSelect || !localitySelect || !btnContinue) {
    return;
  }

  // сбрасываем состояние выбранного местоположения
  SELECTED_LOCATION = {
    level1: null,
    level2: null,
    level3: null,
    level4: null,
    kato: null
  };

  function resetSelect(select, disabled) {
    select.innerHTML = `<option value="">— ... —</option>`;
    select.disabled = !!disabled;
  }

  function populateSelect(select, items) {
    resetSelect(select, !items || !items.length);
    if (!items || !items.length) return;

    for (const item of items) {
      const opt = document.createElement("option");
      opt.value = item.code;
      opt.textContent = LANG === "kk" ? item.name_kk : item.name_ru;
      select.appendChild(opt);
    }
    select.disabled = false;
  }

  function updateContinueButton() {
    if (!btnContinue) return;

    const result = getSelectedKatoNode();
    if (!result) {
      btnContinue.disabled = true;
      SELECTED_LOCATION.kato = null;
      return;
    }

    const node = result.node;
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;

    // если у выбранного узла нет детей — это "последний существующий уровень"
    btnContinue.disabled = hasChildren;

    if (!btnContinue.disabled) {
      SELECTED_LOCATION.kato = node.code;
    } else {
      SELECTED_LOCATION.kato = null;
    }
  }

  function handleRegionChange() {
    const code = regionSelect.value || null;
    SELECTED_LOCATION.level1 = code;
    SELECTED_LOCATION.level2 = null;
    SELECTED_LOCATION.level3 = null;
    SELECTED_LOCATION.level4 = null;

    const nodeInfo = findKatoNode(code);
    const children = nodeInfo && Array.isArray(nodeInfo.node.children)
      ? nodeInfo.node.children
      : [];

    populateSelect(districtSelect, children);
    resetSelect(localitySelect, true);

    updateContinueButton();
  }

  function handleDistrictChange() {
    const code = districtSelect.value || null;
    SELECTED_LOCATION.level2 = code;
    SELECTED_LOCATION.level3 = null;
    SELECTED_LOCATION.level4 = null;

    const nodeInfo = findKatoNode(code);
    const children = nodeInfo && Array.isArray(nodeInfo.node.children)
      ? nodeInfo.node.children
      : [];

    populateSelect(localitySelect, children);

    updateContinueButton();
  }

  function handleLocalityChange() {
    const code = localitySelect.value || null;
    SELECTED_LOCATION.level3 = code;
    SELECTED_LOCATION.level4 = null;

    updateContinueButton();
  }

  // инициализация селектов
  populateSelect(regionSelect, MOCK_KATO);
  resetSelect(districtSelect, true);
  resetSelect(localitySelect, true);

  updateContinueButton();

  regionSelect.addEventListener("change", handleRegionChange);
  districtSelect.addEventListener("change", handleDistrictChange);
  localitySelect.addEventListener("change", handleLocalityChange);

  btnContinue.addEventListener("click", () => {
    if (btnContinue.disabled || !SELECTED_LOCATION.kato) return;

    // По ТЗ: после выбора последнего существующего уровня → переход на input_account
    CURRENT_PAGE = "input_account";
    renderPage();
  });
}

// ===============================
// Рендер страниц SPA
// ===============================
function renderPage() {
  const page = document.getElementById("site-page");
  const tx = t();

  if (CURRENT_PAGE === "home") {
    renderHome(page);
    return;
  }

  if (CURRENT_PAGE === "send") {
    renderSend(page);
    return;
  }

  if (CURRENT_PAGE === "input_account") {
    renderInputAccount(page);
    return;
  }

  if (CURRENT_PAGE === "about") {
    renderSimplePage(page, tx.about_title, tx.about_desc);
    return;
  }

  if (CURRENT_PAGE === "contacts") {
    renderSimplePage(page, tx.contacts_title, tx.contacts_desc);
    return;
  }

  if (CURRENT_PAGE === "help") {
    renderSimplePage(page, tx.help_title, tx.help_desc);
    return;
  }

  // fallback
  renderHome(page);
}

// ===============================
// Первый запуск
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderPage();
});
