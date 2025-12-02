// ===============================
// Глобальное состояние
// ===============================
let LANG = 'kk';          // по умолчанию казахский
let CURRENT_PAGE = 'home';
let SELECTED_LOCATION = null; // сюда кладём выбранный КАТО и подписи
let SELECTED_USER_TYPE = null; // FL / UL / SUPPLIER

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
  const page = document.getElementById('site-page') || document.getElementById('app');
  const tx = t();

  let html = '';

  if (CURRENT_PAGE === 'home') {
    html = `
      <h1>${tx.home_title}</h1>
      <p>${tx.home_desc}</p>
    `;
  }

  if (CURRENT_PAGE === 'send') {
    html = `
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

  if (CURRENT_PAGE === 'choose_user_type') {
    // если по какой-то причине нет выбранного НП — откатываемся на шаг выбора НП
    if (!SELECTED_LOCATION) {
      CURRENT_PAGE = 'send';
      renderPage();
      return;
    }

    const chain =
      `${SELECTED_LOCATION.region}` +
      (SELECTED_LOCATION.district || SELECTED_LOCATION.okrug
        ? ` → ${SELECTED_LOCATION.district || SELECTED_LOCATION.okrug}`
        : '') +
      (SELECTED_LOCATION.locality
        ? ` → ${SELECTED_LOCATION.locality}`
        : '');

    html = `
      <h1>${tx.send_title}</h1>

      <section class="card">
        <h2 class="card-title">${tx.send_user_type_title}</h2>
        <p class="card-hint">${tx.send_user_type_subtitle}</p>

        <p style="font-size:0.9rem; color:#4b5563; margin-bottom:12px;">
          ${chain}<br/>
          KATO: <strong>${SELECTED_LOCATION.kato}</strong>
        </p>

        <div class="choice-grid">
          <button class="choice-btn" data-type="FL">
            ${tx.send_user_type_fl}
          </button>
          <button class="choice-btn" data-type="UL">
            ${tx.send_user_type_ul}
          </button>
          <button class="choice-btn" data-type="SUPPLIER">
            ${tx.send_user_type_supplier}
          </button>
        </div>
      </section>
    `;
  }

  if (CURRENT_PAGE === 'about') {
    html = `<h1>${tx.about_title || ''}</h1><p>${tx.about_desc || ''}</p>`;
  }

  if (CURRENT_PAGE === 'contacts') {
    html = `<h1>${tx.contacts_title || ''}</h1><p>${tx.contacts_desc || ''}</p>`;
  }

  if (CURRENT_PAGE === 'help') {
    html = `<h1>${tx.help_title || ''}</h1><p>${tx.help_desc || ''}</p>`;
  }

  page.innerHTML = html;

  if (CURRENT_PAGE === 'send') {
    initSendPage();
  }

  if (CURRENT_PAGE === 'choose_user_type') {
    initUserTypePage();
  }
}

// ===============================
// Инициализация страницы "Көрсеткіш жіберу"
// (каскадный выбор по KATO_MOCK)
// ===============================
function initSendPage() {
  const regionSelect   = document.getElementById('region-select');
  const districtSelect = document.getElementById('district-select');
  const localitySelect = document.getElementById('locality-select');
  const continueBtn    = document.getElementById('send-location-continue');

  if (!regionSelect || !districtSelect || !localitySelect || !continueBtn) return;

  const lang        = LANG;
  const regionKey   = lang === 'kk' ? 'region_kk'   : 'region_ru';
  const districtKey = lang === 'kk' ? 'district_kk' : 'district_ru';
  const okrugKey    = lang === 'kk' ? 'okrug_kk'    : 'okrug_ru';
  const localityKey = lang === 'kk' ? 'locality_kk' : 'locality_ru';

  // Сброс состояния
  regionSelect.innerHTML   = '<option value="">— ... —</option>';
  districtSelect.innerHTML = '<option value="">— ... —</option>';
  localitySelect.innerHTML = '<option value="">— ... —</option>';

  regionSelect.disabled   = false;
  districtSelect.disabled = true;
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

  // === 2. Обработчик выбора региона ===
  regionSelect.onchange = () => {
    const regionName = regionSelect.value;

    districtSelect.innerHTML = '<option value="">— ... —</option>';
    localitySelect.innerHTML = '<option value="">— ... —</option>';
    districtSelect.disabled  = true;
    localitySelect.disabled  = true;
    continueBtn.disabled     = true;
    SELECTED_LOCATION        = null;

    if (!regionName) return;

    const regionRows = KATO_MOCK.filter(r => r[regionKey] === regionName);

    // Проверяем, есть ли "второй уровень" (район / округ)
    const level2Names = new Set();
    regionRows.forEach(r => {
      const lvl2 = r[districtKey] || r[okrugKey] || '';
      if (lvl2) level2Names.add(lvl2);
    });

    // Функция заполнения населённых пунктов
    function fillLocalities(rows) {
      localitySelect.innerHTML = '<option value="">— ... —</option>';
      const seenLocs = new Map();

      rows.forEach(r => {
        const locName =
          r[localityKey] ||
          r[okrugKey] ||
          r[districtKey] ||
          r[regionKey];

        const code = r.code;
        if (!code || seenLocs.has(code)) return;

        seenLocs.set(code, locName);
        const opt = document.createElement('option');
        opt.value = code;
        opt.textContent = locName;
        localitySelect.appendChild(opt);
      });

      localitySelect.disabled = false;
    }

    // Если второго уровня нет — сразу показываем список населённых пунктов
    if (level2Names.size === 0) {
      fillLocalities(regionRows);
    } else {
      // Иначе даём выбрать район/округ
      districtSelect.disabled = false;

      level2Names.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        districtSelect.appendChild(opt);
      });

      districtSelect.onchange = () => {
        const level2 = districtSelect.value;
        localitySelect.innerHTML = '<option value="">— ... —</option>';
        localitySelect.disabled  = true;
        continueBtn.disabled     = true;
        SELECTED_LOCATION        = null;

        if (!level2) return;

        const rows2 = regionRows.filter(r => {
          const lvl2 = r[districtKey] || r[okrugKey] || '';
          return lvl2 === level2;
        });

        fillLocalities(rows2);
      };
    }

    // Обработчик выбора населённого пункта
    localitySelect.onchange = () => {
      const kato = localitySelect.value;
      if (!kato) {
        continueBtn.disabled = true;
        SELECTED_LOCATION    = null;
        return;
      }

      const row = KATO_MOCK.find(r => r.code === kato);

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

    // Нажатие "Продолжить"
    continueBtn.onclick = () => {
      if (!SELECTED_LOCATION) return;
      CURRENT_PAGE = 'choose_user_type';
      renderPage();
    };
  };
}

// ===============================
// Инициализация страницы выбора типа пользователя
// ===============================
function initUserTypePage() {
  const buttons = document.querySelectorAll('.choice-btn');
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.onclick = () => {
      const type = btn.dataset.type; // FL / UL / SUPPLIER
      SELECTED_USER_TYPE = type;

      // временно — просто показываем alert.
      // На следующем шаге здесь сделаем переход:
      // FL       -> страница для физлица
      // UL       -> страница для юрлица
      // SUPPLIER -> кабинет поставщика
      const tx = t();
      let typeLabel = '';

      if (type === 'FL') typeLabel = tx.send_user_type_fl;
      if (type === 'UL') typeLabel = tx.send_user_type_ul;
      if (type === 'SUPPLIER') typeLabel = tx.send_user_type_supplier;

      alert(`${typeLabel}\nKATO: ${SELECTED_LOCATION?.kato || ''}`);
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
