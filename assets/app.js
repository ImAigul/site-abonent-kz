// Глобальное состояние
const STATE = {
  lang: "kz",
  currentPage: "home",
  kato: null,
  service: null,
  clientType: null,
  authenticated: false
};

// Переключение языка
function setLang(lang) {
  STATE.lang = lang;
  render();
}

// Рендер шапки
function renderHeader() {
  const t = TEXTS[STATE.lang];

  document.getElementById("menu").innerHTML = `
    <a onclick="go('home')">${t.menu.home}</a>
    <a onclick="go('about')">${t.menu.about}</a>
    <a onclick="go('contacts')">${t.menu.contacts}</a>
    <a onclick="go('help')">${t.menu.help}</a>
  `;

  document.getElementById("lang-switch").innerHTML = `
    <span onclick="setLang('kz')" class="${STATE.lang === 'kz' ? 'active' : ''}">KZ</span>
    <span onclick="setLang('ru')" class="${STATE.lang === 'ru' ? 'active' : ''}">RU</span>
  `;
}

// Переход по страницам
function go(page) {
  STATE.currentPage = page;
  render();
}

// Рендер страниц
function render() {
  renderHeader();

  const app = document.getElementById("app");

  switch (STATE.currentPage) {
    case "home": app.innerHTML = renderHome(); break;
    case "choose_service_type": app.innerHTML = renderChooseServiceType(); break;
    case "input_account": app.innerHTML = renderInputAccount(); break;
    case "input_contract": app.innerHTML = renderInputContract(); break;
    case "input_readings": app.innerHTML = renderInputReadings(); break;
    case "supplier_login": app.innerHTML = renderSupplierLogin(); break;
    case "supplier_report": app.innerHTML = renderSupplierReport(); break;
    default:
      app.innerHTML = "<div>Page not found</div>";
  }
}

// Пустые страницы (заполняем на следующем этапе)
function renderHome() { return `<div class="page">HOME PAGE</div>`; }
function renderChooseServiceType() { return `<div class="page">CHOOSE SERVICE</div>`; }
function renderInputAccount() { return `<div class="page">INPUT ACCOUNT</div>`; }
function renderInputContract() { return `<div class="page">INPUT CONTRACT</div>`; }
function renderInputReadings() { return `<div class="page">INPUT READINGS</div>`; }
function renderSupplierLogin() { return `<div class="page">SUPPLIER LOGIN</div>`; }
function renderSupplierReport() { return `<div class="page">SUPPLIER REPORT</div>`; }

// Инициализация
document.addEventListener("DOMContentLoaded", render);
