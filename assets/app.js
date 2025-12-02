// ===============================
// Глобальное состояние
// ===============================
let LANG = 'kk'; // по умолчанию казахский
let CURRENT_PAGE = 'home';

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
  const page = document.getElementById('site-page');
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

  // позже сюда добавим: initSendPage()
}


// ===============================
// Первый запуск
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderPage();
});
