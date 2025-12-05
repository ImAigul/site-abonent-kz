// Глобальное состояние
const STATE = {
  lang: "kz",
  currentPage: "home",
  kato: null,
  service: null,
  clientType: null,
  authenticated: false
};

// Рендер страниц
function render() {
  const app = document.getElementById("app");

  switch (STATE.currentPage) {
    case "home":
      app.innerHTML = renderHome();
      break;

    case "choose_service_type":
      app.innerHTML = renderChooseServiceType();
      break;

    case "input_account":
      app.innerHTML = renderInputAccount();
      break;

    case "input_contract":
      app.innerHTML = renderInputContract();
      break;

    case "input_readings":
      app.innerHTML = renderInputReadings();
      break;

    case "supplier_login":
      app.innerHTML = renderSupplierLogin();
      break;

    case "supplier_report":
      app.innerHTML = renderSupplierReport();
      break;

    default:
      app.innerHTML = "<div>Page not found</div>";
  }
}

// Пустые функции рендера (будем заполнять строго по ТЗ)
function renderHome() {
  return `<div>HOME PAGE</div>`;
}

function renderChooseServiceType() {
  return `<div>CHOOSE SERVICE TYPE</div>`;
}

function renderInputAccount() {
  return `<div>INPUT ACCOUNT</div>`;
}

function renderInputContract() {
  return `<div>INPUT CONTRACT</div>`;
}

function renderInputReadings() {
  return `<div>INPUT READINGS</div>`;
}

function renderSupplierLogin() {
  return `<div>SUPPLIER LOGIN</div>`;
}

function renderSupplierReport() {
  return `<div>SUPPLIER REPORT</div>`;
}

// Инициализация
document.addEventListener("DOMContentLoaded", render);
