// ===============================
// Глобальное состояние
// ===============================
let LANG = 'kk';          // по умолчанию казахский
let CURRENT_PAGE = 'home';
let SELECTED_LOCATION = null; // выбранный КАТО и подписи
let CLIENT_TYPE = null;       // FL / UL / SUPPLIER

// Простейший мок KATO для фронта (потом заменим на API)
const KATO_MOCK = [
  {
    code: '710000000',
    region_kk: 'Астана қ.',
    region_ru: 'г.Астана',
    district_kk: '',
    district_ru: '',
    okrug_kk: '',
    okrug_ru: '',
    locality_kk: 'Алматы ауданы',
    locality_ru: 'район Алматы'
  },
  {
    code: '103230100',
    region_kk: 'Абай облысы',
    region_ru: 'область Абай',
    district_kk: 'Абай ауданы',
    district_ru: 'Абайский район',
    okrug_kk: 'Қарауыл ауылдық округі',
    okrug_ru: 'Карааульский с.о.',
    locality_kk: 'Қарауыл ауылы',
    locality_ru: 'с. Карааул'
  },
  {
    code: '103230200',
    region_kk: 'Абай облысы',
    region_ru: 'область Абай',
    district_kk: 'Абай ауданы',
    district_ru: 'Абайский район',
    okrug_kk: 'Қарауыл ауылдық округі',
    okrug_ru: 'Карааульский с.о.',
    locality_kk: 'Басқа ауыл',
    locality_ru: 'Другое село'
  }
];

// Получаем тексты для текущего языка
function t() {
  return window.TEXTS[LANG];
}

// ===============================
// Рендер шапки (меню)
// ===============================
function renderHeader() {
  const header = document.getElementById('site-header');
  const tx = t();

  header.className = 'site-header';
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
        <button class="lang-btn" data-lang="kk" ${LANG === 'kk' ? 'data-active="1"' : ''}>KAZ</button>
        <button class="lang-btn" data-lang="ru" ${LANG === 'ru' ? 'data-active="1"' : ''}>RUS</button>
      </div>
    </div>
  `;

  // Слушатели меню
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.onclick = () => {
      CURRENT_PAGE = btn.dataset.page;
      renderPage();
    };
  });

  // Слушатели смены языка
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.onclick = () => {
      LANG = btn.dataset.lang;
      renderHeader();
      renderPage();
    };
  });
}

// ===============================
// Рендер страниц SPA
// ===============================
function renderPage() {
  const root = document.getElementById('site-page') || document.getElementById('app');
  const tx = t();

  let html = '<main class="site-main">';

  if (CURRENT_PAGE === 'home') {
    html += `
      <h1>${tx.home_title}</h1>
      <p>${tx.home_desc}</p>
    `;
  }

  if (CURRENT_PAGE === 'send') {
    html += `
      <h1>${tx.send_title}</h1>
      <p>${tx.send_desc}</p>

      <section class="card">
        <h2 class="card-title">${tx.send_step_location_title}</h2>
        <p class="card-hint">${tx.send_step_location_hint}</p>

        <div class="form-grid">
          <div class="form-field">
            <label for="region-select">${tx.send_region_label}</label>
            <select id="region-select" disabled>
              <option value="">— ... —</option>
            </select>
          </div>

          <div class="form-field">
            <label for="district-select">${tx.send_district_label}</label>
            <select id="district-select" disabled>
              <option value="">— ... —</option>
            </select>
          </div>

          <div class="form-field">
            <label for="okrug-select">${tx.send_okrug_label}</label>
            <select id="okrug-select" disabled>
              <option value="">— ... —</option>
            </select>
          </div>

          <div class="form-field">
            <label for="locality-select">${tx.send_locality_label}</label>
            <select id="locality-select" disabled>
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
  }

  // Новая страница: выбор типа пользователя
  if (CURRENT_PAGE === 'choose_user_type') {
    if (!SELECTED_LOCATION) {
      // если по какой-то причине зашли сюда без выбора НП — вернём на шаг выбора
      CURRENT_PAGE = 'send';
      renderPage();
      return;
    }

    const chainParts = [
      SELECTED_LOCATION.region,
      SELECTED_LOCATION.district || SELECTED_LOCATION.okrug || '',
      SELECTED_LOCATION.locality || ''
    ].filter(Boolean);
    const chain = chainParts.join(' → ');

    html += `
      <h1>${tx.user_type_title}</h1>
      <p>${tx.user_type_desc}</p>

      <section class="card">
        <h2 class="card-title">${chain}</h2>
        <p class="card-hint">KATO: ${SELECTED_LOCATION.kato}</p>

        <div class="user-type-grid">
          <button class="user-type-btn" data-client-type="FL">
            ${tx.user_type_fl}
          </button>
          <button class="user-type-btn" data-client-type="UL">
            ${tx.user_type_ul}
          </button>
          <button class="user-type-btn" data-client-type="SUPPLIER">
            ${tx.user_type_supplier}
          </button>
        </div>
      </section>
    `;
  }

  if (CURRENT_PAGE === 'about') {
    html += `<h1>${tx.about_title || ''}</h1><p>${tx.about_desc || ''}</p>`;
  }

  if (CURRENT_PAGE === 'contacts') {
    html += `<h1>${tx.contacts_title || ''}</h1><p>${tx.contacts_desc || ''}</p>`;
  }

  if (CURRENT_PAGE === 'help') {
    html += `<h1>${tx.help_title || ''}</h1><p>${tx.help_desc || ''}</p>`;
  }

  html += '</main>';
  root.innerHTML = html;

  // Инициализация логики для конкретных страниц
  if (CURRENT_PAGE === 'send') {
    initSendPage();
  }
  if (CURRENT_PAGE === 'choose_user_type') {
    initUserTypePage();
  }
}

// ===============================
// Инициализация страницы "Көрсеткіш жіберу"
// 4 уровня: регион → район → округ → НП
// ===============================
function initSendPage() {
  const regionSelect   = document.getElementById('region-select');
  const districtSelect = document.getElementById('district-select');
  const okrugSelect    = document.getElementById('okrug-select');
  const localitySelect = document.getElementById('locality-select');
  const continueBtn    = document.getElementById('send-location-continue');

  if (!regionSelect || !districtSelect || !okrugSelect || !localitySelect || !continueBtn) return;

  const lang        = LANG;
  const regionKey   = lang === 'kk' ? 'region_kk'   : 'region_ru';
  const districtKey = lang === 'kk' ? 'district_kk' : 'district_ru';
  const okrugKey    = lang === 'kk' ? 'okrug_kk'    : 'okrug_ru';
  const localityKey = lang === 'kk' ? 'locality_kk' : 'locality_ru';

  // Сброс состояния
  regionSelect.innerHTML   = '<option value="">— ... —</option>';
  districtSelect.innerHTML = '<option value="">— ... —</option>';
  okrugSelect.innerHTML    = '<option value="">— ... —</option>';
  localitySelect.innerHTML = '<option value="">— ... —</option>';

  regionSelect.disabled   = false;
  districtSelect.disabled = true;
  okrugSelect.disabled    = true;
  localitySelect.disabled = true;
  continueBtn.disabled    = true;
  SELECTED_LOCATION       = null;

  // === 1. Наполняем список регионов ===
  const seenRegions = new Set();

  KATO_MOCK.forEach(row => {
    const name = row[regionKey];
    if (!name || seenRegions.has(name)) return;
    seenRegions.add(name);
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    regionSelect.appendChild(opt);
  });

  // Хелпер: заполнить НП и навесить обработчики
  function attachLocalityHandlers(rowsBase) {
    localitySelect.innerHTML = '<option value="">— ... —</option>';
    const seenLocs = new Map();

    rowsBase.forEach(r => {
      const code = r.code;
      if (!code || seenLocs.has(code)) return;

      const locName =
        r[localityKey] ||
        r[okrugKey] ||
        r[districtKey] ||
        r[regionKey];

      seenLocs.set(code, locName);

      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = locName;
      localitySelect.appendChild(opt);
    });

    localitySelect.disabled = false;
    continueBtn.disabled    = true;
    SELECTED_LOCATION       = null;

    localitySelect.onchange = () => {
      const kato = localitySelect.value;
      if (!kato) {
        continueBtn.disabled = true;
        SELECTED_LOCATION    = null;
        return;
      }

      const row = rowsBase.find(r => r.code === kato);

      SELECTED_LOCATION = row
        ? {
            kato:     row.code,
            region:   row[regionKey],
            district: row[districtKey] || '',
            okrug:    row[okrugKey]    || '',
            locality: row[localityKey] || ''
          }
        : null;

      continueBtn.disabled = !SELECTED_LOCATION;
    };

    // вместо alert — переход на страницу выбора типа клиента
    continueBtn.onclick = () => {
      if (!SELECTED_LOCATION) return;
      CURRENT_PAGE = 'choose_user_type';
      renderPage();
    };
  }

  // Хелпер: на основе набора строк решаем — есть ли округа, и что показывать
  function updateOkrugAndLocalityFrom(rowsBase) {
    okrugSelect.innerHTML    = '<option value="">— ... —</option>';
    localitySelect.innerHTML = '<option value="">— ... —</option>';

    okrugSelect.disabled    = true;
    localitySelect.disabled = true;
    continueBtn.disabled    = true;
    SELECTED_LOCATION       = null;

    const okrugNames = new Set();
    rowsBase.forEach(r => {
      const name = r[okrugKey];
      if (name) okrugNames.add(name);
    });

    // Если есть отдельные округа/кенттер → сначала выбираем их
    if (okrugNames.size > 0) {
      okrugSelect.disabled = false;

      okrugNames.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        okrugSelect.appendChild(opt);
      });

      okrugSelect.onchange = () => {
        const okrugName = okrugSelect.value;

        localitySelect.innerHTML = '<option value="">— ... —</option>';
        localitySelect.disabled  = true;
        continueBtn.disabled     = true;
        SELECTED_LOCATION        = null;

        if (!okrugName) return;

        const rowsForOkrug = rowsBase.filter(r => r[okrugKey] === okrugName);
        attachLocalityHandlers(rowsForOkrug);
      };
    } else {
      // Округов нет — сразу показываем список НП
      attachLocalityHandlers(rowsBase);
    }
  }

  // === 2. Обработчик выбора региона ===
  regionSelect.onchange = () => {
    const regionName = regionSelect.value;

    districtSelect.innerHTML = '<option value="">— ... —</option>';
    okrugSelect.innerHTML    = '<option value="">— ... —</option>';
    localitySelect.innerHTML = '<option value="">— ... —</option>';

    districtSelect.disabled = true;
    okrugSelect.disabled    = true;
    localitySelect.disabled = true;
    continueBtn.disabled    = true;
    SELECTED_LOCATION       = null;

    if (!regionName) return;

    const regionRows = KATO_MOCK.filter(r => r[regionKey] === regionName);

    // Проверяем, есть ли отдельные районы
    const districtNames = new Set();
    regionRows.forEach(r => {
      const name = r[districtKey];
      if (name) districtNames.add(name);
    });

    if (districtNames.size > 0) {
      districtSelect.disabled = false;

      districtNames.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        districtSelect.appendChild(opt);
      });

      districtSelect.onchange = () => {
        const districtName = districtSelect.value;

        okrugSelect.innerHTML    = '<option value="">— ... —</option>';
        localitySelect.innerHTML = '<option value="">— ... —</option>';
        okrugSelect.disabled     = true;
        localitySelect.disabled  = true;
        continueBtn.disabled     = true;
        SELECTED_LOCATION        = null;

        if (!districtName) return;

        const rowsForDistrict = regionRows.filter(r => r[districtKey] === districtName);
        updateOkrugAndLocalityFrom(rowsForDistrict);
      };
    } else {
      // Районов нет — сразу переходим к округам/НП
      updateOkrugAndLocalityFrom(regionRows);
    }
  };
}

// ===============================
// Страница выбора типа пользователя
// ===============================
function initUserTypePage() {
  const buttons = document.querySelectorAll('.user-type-btn');
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.onclick = () => {
      CLIENT_TYPE = btn.dataset.clientType; // FL / UL / SUPPLIER
      const tx = t();

      if (CLIENT_TYPE === 'FL') {
        alert(tx.user_type_chosen_fl);
      } else if (CLIENT_TYPE === 'UL') {
        alert(tx.user_type_chosen_ul);
      } else if (CLIENT_TYPE === 'SUPPLIER') {
        alert(tx.user_type_chosen_supplier);
      }

      // Дальше здесь будет переход:
      // FL / UL → ввод лицевого счёта / договора
      // SUPPLIER → форма входа по ключу
    };
  });
}

// ===============================
// Первый запуск
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderPage();
});
