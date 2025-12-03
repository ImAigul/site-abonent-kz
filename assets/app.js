// assets/app.js

// Глобальное состояние приложения
const AppState = {
  lang: "kk",              // "kk" или "ru"
  page: "home",            // "home" | "send" | "identify_fl" | "identify_ul" | "identify_supplier" | "choose_service" | "supplier_stub"
  clientType: null,        // "FL" | "UL" | "SUPPLIER"
  selectedLocation: {
    regionId: "",
    districtId: "",
    okrugId: "",
    localityId: "",
    kato: ""
  },
  account: null            // текущий лицевой счёт (для демонстрации)
};

// Примитивные мок-данные для каскадного выбора (Астана, Есиль)
const REGIONS = [
  {
    id: "astana",
    name_kk: "Астана қ.",
    name_ru: "г. Астана"
  }
];

const DISTRICTS = [
  {
    id: "esil",
    regionId: "astana",
    name_kk: "Есіл ауданы",
    name_ru: "Есильский район"
  }
];

const OKRUGS = [
  {
    id: "esil_okrug",
    districtId: "esil",
    name_kk: "Есіл ауданы",
    name_ru: "Есильский округ"
  }
];

const LOCALITIES = [
  {
    id: "astana_esil",
    okrugId: "esil_okrug",
    name_kk: "Астана, Есіл ауданы",
    name_ru: "г. Астана, район Есиль",
    kato: "TEST_KATO_ASTANA_ESIL"
  }
];

// Тестовые лицевые счета для демонстрации (г. Астана, район Есиль)
const TEST_ACCOUNTS = ["10001", "10002", "10003", "10004", "10005"];

// Утилита: текущие тексты
function t() {
  return (window.TEXTS && window.TEXTS[AppState.lang]) || window.TEXTS["kk"];
}

// Инициализация
document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderPage();
});

// Общий ре-рендер
function updateView() {
  renderHeader();
  renderPage();
}

/* ======================= ШАПКА / МЕНЮ ======================= */

function renderHeader() {
  const header = document.getElementById("site-header");
  if (!header) return;

  const texts = t();

  header.innerHTML = `
    <div class="nav">
      <div class="nav-logo">Abonent.kz</div>
      <div class="nav-menu">
        <button class="nav-link" data-page="home">${texts.menu_home}</button>
        <button class="nav-link" data-page="send">${texts.menu_send}</button>
        <button class="nav-link" data-page="about">${texts.menu_about}</button>
        <button class="nav-link" data-page="contacts">${texts.menu_contacts}</button>
        <button class="nav-link" data-page="help">${texts.menu_help}</button>
      </div>
      <div class="nav-lang">
        <button class="lang-btn" data-lang="kk" data-active="${AppState.lang === "kk" ? "1" : "0"}">KZ</button>
        <button class="lang-btn" data-lang="ru" data-active="${AppState.lang === "ru" ? "1" : "0"}">RU</button>
      </div>
    </div>
  `;

  // Обработчики меню
  header.querySelectorAll(".nav-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.getAttribute("data-page");
      if (!page) return;

      if (page === "send") {
        // Если тип клиента ещё не выбран — отправляем на главную
        if (!AppState.clientType) {
          AppState.page = "home";
        } else {
          AppState.page = "send";
        }
      } else if (page === "home") {
        AppState.page = "home";
      } else {
        // Пока для about/contacts/help делаем заглушки
        AppState.page = page;
      }

      updateView();
    });
  });

  // Переключение языка
  header.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute("data-lang");
      if (!lang || (lang !== "kk" && lang !== "ru")) return;
      if (AppState.lang === lang) return;
      AppState.lang = lang;
      updateView();
    });
  });
}

/* ======================= РЕНДЕР СТРАНИЦ ======================= */

function renderPage() {
  const app = document.getElementById("app");
  if (!app) return;

  switch (AppState.page) {
    case "home":
      renderHomePage(app);
      break;
    case "send":
      renderSendPage(app);
      break;
    case "identify_fl":
      renderIdentifyFlPage(app);
      break;
    case "identify_ul":
      renderIdentifyUlPage(app);
      break;
    case "identify_supplier":
      renderIdentifySupplierPage(app);
      break;
    case "choose_service":
      renderChooseServicePage(app);
      break;
    case "supplier_stub":
      renderSupplierStubPage(app);
      break;
    case "about":
    case "contacts":
    case "help":
      renderStubPage(app);
      break;
    default:
      renderHomePage(app);
  }
}

/* ======================= ГЛАВНАЯ ======================= */

function renderHomePage(container) {
  const texts = t();

  container.innerHTML = `
    <h1>${texts.home_title}</h1>
    <p>${texts.home_desc || ""}</p>

    <div class="card">
      <div class="card-title">${texts.home_service_title}</div>

      <div class="home-service-grid">
        <button class="home-service-btn" data-client-type="FL">${texts.home_btn_fl}</button>
        <button class="home-service-btn" data-client-type="UL">${texts.home_btn_ul}</button>
        <button class="home-service-btn" data-client-type="SUPPLIER">${texts.home_btn_supplier}</button>
      </div>
    </div>
  `;

  container.querySelectorAll(".home-service-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-client-type");
      if (!type) return;
      AppState.clientType = type;
      AppState.page = "send";
      updateView();
    });
  });
}

/* ======================= СТРАНИЦА ВЫБОРА НП (send) ======================= */

function renderSendPage(container) {
  const texts = t();

  const { regionId, districtId, okrugId, localityId } = AppState.selectedLocation;

  // Фильтрация по выбранным уровням
  const regions = REGIONS;
  const districts = DISTRICTS.filter((d) => d.regionId === regionId);
  const okrugs = OKRUGS.filter((o) => o.districtId === districtId);
  const localities = LOCALITIES.filter((l) => l.okrugId === okrugId);

  const isContinueEnabled = Boolean(localityId);

  container.innerHTML = `
    <h1>${texts.send_title}</h1>
    <p>${texts.send_desc || ""}</p>

    <div class="card">
      <div class="card-title">${texts.send_step_location_title}</div>
      <div class="card-hint">${texts.send_step_location_hint || ""}</div>

      <div class="form-grid">
        <div class="form-field">
          <label>${texts.send_region_label}</label>
          <select id="region-select">
            <option value="">—</option>
            ${regions
              .map((r) => {
                const label = AppState.lang === "kk" ? r.name_kk : r.name_ru;
                const sel = r.id === regionId ? "selected" : "";
                return `<option value="${r.id}" ${sel}>${label}</option>`;
              })
              .join("")}
          </select>
        </div>

        <div class="form-field">
          <label>${texts.send_district_label}</label>
          <select id="district-select" ${regionId ? "" : "disabled"}>
            <option value="">—</option>
            ${districts
              .map((d) => {
                const label = AppState.lang === "kk" ? d.name_kk : d.name_ru;
                const sel = d.id === districtId ? "selected" : "";
                return `<option value="${d.id}" ${sel}>${label}</option>`;
              })
              .join("")}
          </select>
        </div>

        <div class="form-field">
          <label>${texts.send_okrug_label}</label>
          <select id="okrug-select" ${districtId ? "" : "disabled"}>
            <option value="">—</option>
            ${okrugs
              .map((o) => {
                const label = AppState.lang === "kk" ? o.name_kk : o.name_ru;
                const sel = o.id === okrugId ? "selected" : "";
                return `<option value="${o.id}" ${sel}>${label}</option>`;
              })
              .join("")}
          </select>
        </div>

        <div class="form-field">
          <label>${texts.send_locality_label}</label>
          <select id="locality-select" ${okrugId ? "" : "disabled"}>
            <option value="">—</option>
            ${localities
              .map((l) => {
                const label = AppState.lang === "kk" ? l.name_kk : l.name_ru;
                const sel = l.id === localityId ? "selected" : "";
                return `<option value="${l.id}" ${sel}>${label}</option>`;
              })
              .join("")}
          </select>
        </div>
      </div>

      <div class="form-actions">
        <button id="send-continue-btn" class="btn-primary" ${isContinueEnabled ? "enabled" : "disabled"}>
          ${texts.send_continue_btn}
        </button>
      </div>
    </div>
  `;

  // Слушатели
  const regionSelect = container.querySelector("#region-select");
  const districtSelect = container.querySelector("#district-select");
  const okrugSelect = container.querySelector("#okrug-select");
  const localitySelect = container.querySelector("#locality-select");
  const continueBtn = container.querySelector("#send-continue-btn");

  regionSelect.addEventListener("change", () => {
    const newRegionId = regionSelect.value || "";
    AppState.selectedLocation.regionId = newRegionId;
    AppState.selectedLocation.districtId = "";
    AppState.selectedLocation.okrugId = "";
    AppState.selectedLocation.localityId = "";
    AppState.selectedLocation.kato = "";
    updateView();
  });

  districtSelect.addEventListener("change", () => {
    const newDistrictId = districtSelect.value || "";
    AppState.selectedLocation.districtId = newDistrictId;
    AppState.selectedLocation.okrugId = "";
    AppState.selectedLocation.localityId = "";
    AppState.selectedLocation.kato = "";
    updateView();
  });

  okrugSelect.addEventListener("change", () => {
    const newOkrugId = okrugSelect.value || "";
    AppState.selectedLocation.okrugId = newOkrugId;
    AppState.selectedLocation.localityId = "";
    AppState.selectedLocation.kato = "";
    updateView();
  });

  localitySelect.addEventListener("change", () => {
    const newLocalityId = localitySelect.value || "";
    AppState.selectedLocation.localityId = newLocalityId;
    const loc = LOCALITIES.find((l) => l.id === newLocalityId);
    AppState.selectedLocation.kato = loc ? loc.kato : "";
    updateView();
  });

  continueBtn.addEventListener("click", () => {
    if (!AppState.selectedLocation.localityId) return;

    if (!AppState.clientType) {
      const msg =
        AppState.lang === "kk"
          ? "Алдымен қызмет түрін басты беттен таңдаңыз."
          : "Сначала выберите тип пользователя на главной странице.";
      alert(msg);
      AppState.page = "home";
      updateView();
      return;
    }

    if (AppState.clientType === "FL") {
      AppState.page = "identify_fl";
    } else if (AppState.clientType === "UL") {
      AppState.page = "identify_ul";
    } else if (AppState.clientType === "SUPPLIER") {
      AppState.page = "identify_supplier";
    }

    updateView();
  });
}

/* ======================= IDENTIFY FL ======================= */

function renderIdentifyFlPage(container) {
  const texts = t();

  container.innerHTML = `
    <h1>${texts.identify_fl_title}</h1>
    <p>${texts.identify_fl_desc || ""}</p>

    <div class="card">
      <div class="form-grid">
        <div class="form-field">
          <label>${texts.identify_fl_account_label}</label>
          <input type="text" id="fl-account-input" />
        </div>
      </div>

      <div class="form-actions">
        <button id="fl-submit-btn" class="btn-primary">
          ${texts.identify_fl_submit_btn}
        </button>
      </div>
    </div>
  `;

  const accountInput = container.querySelector("#fl-account-input");
  const submitBtn = container.querySelector("#fl-submit-btn");

  submitBtn.addEventListener("click", async () => {
    const account = (accountInput.value || "").trim();
    if (!account) {
      alert(texts.identify_error_required);
      return;
    }

    const kato = AppState.selectedLocation.kato || "";
    const res = await mockCheckAccount({ clientType: "FL", account, kato });

    if (!res.found) {
      const msg =
        AppState.lang === "kk"
          ? "Дербес шот табылмады, қолдау қызметіне немесе абоненттік бөлімге хабарласыңыз."
          : "Лицевой счёт не найден, обратитесь в службу поддержки или абонентский отдел.";
      alert(msg);
      return;
    }

    AppState.account = account;
    AppState.page = "choose_service";
    updateView();
  });
}

/* ======================= IDENTIFY UL ======================= */

function renderIdentifyUlPage(container) {
  const texts = t();

  container.innerHTML = `
    <h1>${texts.identify_ul_title}</h1>
    <p>${texts.identify_ul_desc || ""}</p>

    <div class="card">
      <div class="form-grid">
        <div class="form-field">
          <label>${texts.identify_ul_account_label}</label>
          <input type="text" id="ul-account-input" />
        </div>

        <div class="form-field">
          <label>${texts.identify_ul_contract_label}</label>
          <input type="text" id="ul-contract-input" />
        </div>

        <div class="form-field">
          <label>${texts.identify_ul_contract_date_label}</label>
          <input type="date" id="ul-contract-date-input" />
        </div>
      </div>

      <div class="form-actions">
        <button id="ul-submit-btn" class="btn-primary">
          ${texts.identify_ul_submit_btn}
        </button>
      </div>
    </div>
  `;

  const accountInput = container.querySelector("#ul-account-input");
  const contractInput = container.querySelector("#ul-contract-input");
  const contractDateInput = container.querySelector("#ul-contract-date-input");
  const submitBtn = container.querySelector("#ul-submit-btn");

  submitBtn.addEventListener("click", async () => {
    const account = (accountInput.value || "").trim();
    const contractNo = (contractInput.value || "").trim();
    const contractDate = (contractDateInput.value || "").trim();

    if (!account && !contractNo && !contractDate) {
      alert(texts.identify_error_required);
      return;
    }

    const kato = AppState.selectedLocation.kato || "";
    const res = await mockCheckAccount({
      clientType: "UL",
      account,
      contractNo,
      contractDate,
      kato
    });

    if (!res.found) {
      let msg;
      if (account) {
        msg =
          AppState.lang === "kk"
            ? "Дербес шот табылмады. Қолдау қызметіне немесе абоненттік бөлімге хабарласыңыз."
            : "Лицевой счёт не найден. Обратитесь в службу поддержки или абонентский отдел.";
      } else {
        msg =
          AppState.lang === "kk"
            ? "Шарт табылмады. Енгізілген мәліметтердің дұрыстығын тексеріңіз."
            : "Договор не найден. Убедитесь в правильности введённых данных.";
      }
      alert(msg);
      return;
    }

    AppState.account = account || contractNo || null;
    AppState.page = "choose_service";
    updateView();
  });
}

/* ======================= IDENTIFY SUPPLIER ======================= */

function renderIdentifySupplierPage(container) {
  const texts = t();

  container.innerHTML = `
    <h1>${texts.identify_supplier_title}</h1>
    <p>${texts.identify_supplier_desc || ""}</p>

    <div class="card">
      <div class="form-grid">
        <div class="form-field">
          <label>${texts.identify_supplier_key_label}</label>
          <input type="text" id="supplier-key-input" />
        </div>
      </div>

      <div class="form-actions">
        <button id="supplier-submit-btn" class="btn-primary">
          ${texts.identify_supplier_submit_btn}
        </button>
      </div>
    </div>
  `;

  const keyInput = container.querySelector("#supplier-key-input");
  const submitBtn = container.querySelector("#supplier-submit-btn");

  submitBtn.addEventListener("click", async () => {
    const key = (keyInput.value || "").trim();
    if (!key) {
      alert(texts.identify_error_required);
      return;
    }

    const res = await mockCheckSupplierKey(key);

    if (!res.ok) {
      const msg =
        AppState.lang === "kk"
          ? "Қолжеткізу кілті жарамсыз немесе тіркелмеген."
          : "Ключ доступа неверен или не привязан.";
      alert(msg);
      return;
    }

    // Условно сохраним список КАТО, доступных поставщику
    AppState.supplier = {
      key,
      katoList: res.katoList || []
    };

    AppState.page = "supplier_stub";
    updateView();
  });
}

/* ======================= CHOOSE_SERVICE (заглушка) ======================= */

function renderChooseServicePage(container) {
  const isKz = AppState.lang === "kk";

  const title = isKz ? "Қызмет түрін таңдаңыз" : "Выберите услугу";
  const services = isKz
    ? ["Электр энергиясы", "Ыстық су", "Суық су", "Газ"]
    : ["Электроэнергия", "Горячая вода", "Холодная вода", "Газ"];

  container.innerHTML = `
    <h1>${title}</h1>
    <p>${isKz ? "Келесі қадамда есептегіш көрсеткіштерін енгізу экраны ашылады (әзірге демонстрациялық кезең)." : "На следующем шаге будет экран ввода показаний счётчика (пока демонстрационный этап)."}</p>

    <div class="card">
      <div class="card-title">${title}</div>
      <div class="home-service-grid">
        ${services
          .map(
            (s, idx) =>
              `<button class="home-service-btn" data-service-idx="${idx}">${s}</button>`
          )
          .join("")}
      </div>
    </div>
  `;

  container.querySelectorAll(".home-service-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = btn.getAttribute("data-service-idx");
      console.log("SERVICE SELECTED (mock):", idx);
      const msg = isKz
        ? "Қызмет таңдалды. Келесі қадамда нақты көрсеткіштерді енгізу логикасын қосамыз."
        : "Услуга выбрана. На следующем шаге подключим реальный экран ввода показаний.";
      alert(msg);
    });
  });
}

/* ======================= SUPPLIER STUB ======================= */

function renderSupplierStubPage(container) {
  const isKz = AppState.lang === "kk";

  container.innerHTML = `
    <h1>${isKz ? "Провайдер үшін есеп беру" : "Отчёт для поставщика"}</h1>
    <p>
      ${
        isKz
          ? "Бұл бетте кейінірек КАТО, кезең және форматты (CSV/Excel) таңдау интерфейсі пайда болады. Әзірге бұл демонстрациялық нұсқа."
          : "Здесь позже появится интерфейс выбора КАТО, периода и формата (CSV/Excel). Пока это демонстрационная заглушка."
      }
    </p>
    <div class="card">
      <div class="card-title">
        ${isKz ? "Кілт арқылы сәтті кірдіңіз." : "Вход по ключу выполнен успешно."}
      </div>
      <p>${isKz ? "Кейін бұл жерден толық выгрузка жүктеледі." : "Позже отсюда будет скачиваться полный отчёт."}</p>
    </div>
  `;
}

/* ======================= STUB-СТРАНИЦЫ (about/contacts/help) ======================= */

function renderStubPage(container) {
  const texts = t();
  let title = "";
  let desc = "";

  if (AppState.page === "about") {
    title = texts.about_title || (AppState.lang === "kk" ? "Қызмет туралы" : "О сервисе");
    desc =
      texts.about_desc ||
      (AppState.lang === "kk"
        ? "Бұл бет кейін толық ақпаратпен толтырылады."
        : "Эта страница будет позже заполнена подробной информацией о сервисе.");
  } else if (AppState.page === "contacts") {
    title = texts.contacts_title || (AppState.lang === "kk" ? "Байланыс" : "Контакты");
    desc =
      texts.contacts_desc ||
      (AppState.lang === "kk"
        ? "Мұнда кейін байланыс деректері көрсетіледі."
        : "Здесь позже будут указаны контакты.");
  } else if (AppState.page === "help") {
    title = texts.help_title || (AppState.lang === "kk" ? "Анықтама" : "Справка");
    desc =
      texts.help_desc ||
      (AppState.lang === "kk"
        ? "Бұл бөлімде сервис бойынша нұсқаулықтар болады."
        : "В этом разделе будут размещены инструкции по работе с сервисом.");
  }

  container.innerHTML = `
    <h1>${title}</h1>
    <p>${desc}</p>
  `;
}

/* ======================= MOCK API ======================= */

// Мок проверки ЛС / договора
function mockCheckAccount({ clientType, account, contractNo, contractDate, kato }) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Для ФЛ и ЮЛ через ЛС — считаем найденными только тестовые счета
      if (account) {
        const found = TEST_ACCOUNTS.includes(account);
        resolve({ found });
        return;
      }

      // Для ЮЛ по договору — считаем найденным любой непустой договор
      if (clientType === "UL" && contractNo && contractDate) {
        resolve({ found: true });
        return;
      }

      resolve({ found: false });
    }, 300);
  });
}

// Мок проверки ключа поставщика
function mockCheckSupplierKey(key) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Для демонстрации считаем валидным только ключ "DEMO-KEY"
      if (key === "DEMO-KEY") {
        resolve({
          ok: true,
          katoList: ["TEST_KATO_ASTANA_ESIL"]
        });
      } else {
        resolve({ ok: false });
      }
    }, 300);
  });
}
