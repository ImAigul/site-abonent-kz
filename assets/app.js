// assets/app.js

// Глобальное состояние приложения
const appState = {
  lang: "kk",           // "kk" или "ru"
  page: "home",         // "home" | "send" | "identify_fl" | "identify_ul" | "identify_supplier" | "choose_service" | "supplier_panel"
  clientType: null,     // "fl" | "ul" | "supplier"
  selectedLocation: {
    region: "",
    district: "",
    okrug: "",
    locality: ""
  },
  // моковые данные для лицевых счетов по г.Астана, район Есиль
  testAccounts: ["10001", "10002", "10003", "10004", "10005"]
};

// ---- Утилита: получить текст ----
function t(key) {
  const dict = window.TEXTS[appState.lang] || window.TEXTS["kk"];
  return dict[key] || key;
}

// ---- Рендер шапки ----
function renderHeader() {
  const headerEl = document.getElementById("site-header");
  if (!headerEl) return;

  const lang = appState.lang;

  headerEl.innerHTML = `
    <div class="nav">
      <div class="nav-logo">Abonent.kz</div>

      <div class="nav-menu">
        <button class="nav-link" data-action="nav_home">${t("menu_home")}</button>
        <button class="nav-link" data-action="nav_send">${t("menu_send")}</button>
        <button class="nav-link" data-action="nav_about">${t("menu_about")}</button>
        <button class="nav-link" data-action="nav_contacts">${t("menu_contacts")}</button>
        <button class="nav-link" data-action="nav_help">${t("menu_help")}</button>
      </div>

      <div class="nav-lang">
        <button class="lang-btn" data-lang="kk" data-active="${lang === "kk" ? "1" : "0"}">KZ</button>
        <button class="lang-btn" data-lang="ru" data-active="${lang === "ru" ? "1" : "0"}">RU</button>
      </div>
    </div>
  `;

  // Навигация по меню
  headerEl.querySelectorAll(".nav-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
      switch (action) {
        case "nav_home":
          navigateTo("home");
          break;
        case "nav_send":
          // ВАЖНО: чтобы не ломать логику, сначала выбираем тип на главной
          navigateTo("home");
          // скролл к кнопкам можно потом добавить, сейчас достаточно
          break;
        case "nav_about":
          navigateTo("about");
          break;
        case "nav_contacts":
          navigateTo("contacts");
          break;
        case "nav_help":
          navigateTo("help");
          break;
      }
    });
  });

  // Переключение языка
  headerEl.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const langCode = btn.getAttribute("data-lang");
      if (langCode && langCode !== appState.lang) {
        appState.lang = langCode;
        renderApp();
      }
    });
  });
}

// ---- Навигация между страницами ----
function navigateTo(page) {
  appState.page = page;
  renderApp();
}

// ---- Моки для выбора населённого пункта (демо г.Астана, район Есиль) ----
const KATO_MOCK = {
  regions: [
    {
      id: "astana",
      kk: "Астана қ.",
      ru: "г. Астана",
      districts: [
        {
          id: "esil",
          kk: "Есіл ауданы",
          ru: "район Есиль",
          okrugs: [
            {
              id: "esil-okrug",
              kk: "Есіл а.о.",
              ru: "Есильский с.о.",
              localities: [
                {
                  id: "astana-esil",
                  kk: "Астана қ., Есіл ауданы",
                  ru: "г. Астана, район Есиль",
                  kato: "710000000000" // тестовый KATO
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// ---- Рендер главной страницы ----
function renderHome() {
  const lang = appState.lang;
  const appEl = document.getElementById("app");
  if (!appEl) return;

  appEl.innerHTML = `
    <section>
      <h1>${t("home_title")}</h1>
      <p>${t("home_service_title")}</p>

      <div class="home-service-grid">
        <button class="home-service-btn" data-client-type="fl">
          ${t("home_btn_fl")}
        </button>
        <button class="home-service-btn" data-client-type="ul">
          ${t("home_btn_ul")}
        </button>
        <button class="home-service-btn" data-client-type="supplier">
          ${t("home_btn_supplier")}
        </button>
      </div>
    </section>
  `;

  // Обработка выбора типа клиента
  appEl.querySelectorAll(".home-service-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-client-type"); // "fl" | "ul" | "supplier"
      appState.clientType = type;
      // обнуляем выбранный НП
      appState.selectedLocation = { region: "", district: "", okrug: "", locality: "" };
      // переходим на выбор населённого пункта
      navigateTo("send");
    });
  });
}

// ---- Рендер страницы выбора населённого пункта ----
function renderSend() {
  const appEl = document.getElementById("app");
  if (!appEl) return;

  // если тип клиента не выбран — возвращаем на главную
  if (!appState.clientType) {
    navigateTo("home");
    return;
  }

  const lang = appState.lang;

  const regions = KATO_MOCK.regions;
  const selected = appState.selectedLocation;

  appEl.innerHTML = `
    <section>
      <h1>${t("send_title")}</h1>
      <p>${t("send_desc")}</p>

      <div class="card">
        <div class="card-title">${t("send_step_location_title")}</div>
        <div class="card-hint">${t("send_step_location_hint")}</div>

        <div class="form-grid">
          <div class="form-field">
            <label>${t("send_region_label")}</label>
            <select id="region-select">
              <option value="">—</option>
              ${regions
                .map((r) => {
                  const label = lang === "kk" ? r.kk : r.ru;
                  const sel = selected.region === r.id ? 'selected' : '';
                  return `<option value="${r.id}" ${sel}>${label}</option>`;
                })
                .join("")}
            </select>
          </div>

          <div class="form-field">
            <label>${t("send_district_label")}</label>
            <select id="district-select">
              <option value="">—</option>
            </select>
          </div>

          <div class="form-field">
            <label>${t("send_okrug_label")}</label>
            <select id="okrug-select">
              <option value="">—</option>
            </select>
          </div>

          <div class="form-field">
            <label>${t("send_locality_label")}</label>
            <select id="locality-select">
              <option value="">—</option>
            </select>
          </div>
        </div>

        <div class="form-actions">
          <button id="btn-location-continue" class="btn-primary" disabled>
            ${t("send_continue_btn")}
          </button>
        </div>
      </div>
    </section>
  `;

  const regionSelect = document.getElementById("region-select");
  const districtSelect = document.getElementById("district-select");
  const okrugSelect = document.getElementById("okrug-select");
  const localitySelect = document.getElementById("locality-select");
  const continueBtn = document.getElementById("btn-location-continue");

  function fillDistricts() {
    districtSelect.innerHTML = `<option value="">—</option>`;
    okrugSelect.innerHTML = `<option value="">—</option>`;
    localitySelect.innerHTML = `<option value="">—</option>`;

    const regionId = regionSelect.value;
    appState.selectedLocation.region = regionId || "";
    appState.selectedLocation.district = "";
    appState.selectedLocation.okrug = "";
    appState.selectedLocation.locality = "";
    checkContinueDisabled();

    if (!regionId) return;

    const region = regions.find((r) => r.id === regionId);
    if (!region) return;

    region.districts.forEach((d) => {
      const label = lang === "kk" ? d.kk : d.ru;
      const sel = appState.selectedLocation.district === d.id ? "selected" : "";
      districtSelect.innerHTML += `<option value="${d.id}" ${sel}>${label}</option>`;
    });
  }

  function fillOkrugs() {
    okrugSelect.innerHTML = `<option value="">—</option>`;
    localitySelect.innerHTML = `<option value="">—</option>`;

    const regionId = regionSelect.value;
    const districtId = districtSelect.value;
    appState.selectedLocation.district = districtId || "";
    appState.selectedLocation.okrug = "";
    appState.selectedLocation.locality = "";
    checkContinueDisabled();

    if (!regionId || !districtId) return;

    const region = regions.find((r) => r.id === regionId);
    const district = region?.districts.find((d) => d.id === districtId);
    if (!district) return;

    district.okrugs.forEach((o) => {
      const label = lang === "kk" ? o.kk : o.ru;
      const sel = appState.selectedLocation.okrug === o.id ? "selected" : "";
      okrugSelect.innerHTML += `<option value="${o.id}" ${sel}>${label}</option>`;
    });
  }

  function fillLocalities() {
    localitySelect.innerHTML = `<option value="">—</option>`;

    const regionId = regionSelect.value;
    const districtId = districtSelect.value;
    const okrugId = okrugSelect.value;

    appState.selectedLocation.okrug = okrugId || "";
    appState.selectedLocation.locality = "";
    checkContinueDisabled();

    if (!regionId || !districtId || !okrugId) return;

    const region = regions.find((r) => r.id === regionId);
    const district = region?.districts.find((d) => d.id === districtId);
    const okrug = district?.okrugs.find((o) => o.id === okrugId);
    if (!okrug) return;

    okrug.localities.forEach((loc) => {
      const label = lang === "kk" ? loc.kk : loc.ru;
      const sel = appState.selectedLocation.locality === loc.id ? "selected" : "";
      localitySelect.innerHTML += `<option value="${loc.id}" ${sel}>${label}</option>`;
    });
  }

  function checkContinueDisabled() {
    const regionId = appState.selectedLocation.region;
    const districtId = appState.selectedLocation.district;
    const okrugId = appState.selectedLocation.okrug;
    const locId = appState.selectedLocation.locality;
    continueBtn.disabled = !(regionId && districtId && okrugId && locId);
  }

  // начальная инициализация
  fillDistricts();
  fillOkrugs();
  checkContinueDisabled();

  regionSelect.addEventListener("change", () => {
    fillDistricts();
  });

  districtSelect.addEventListener("change", () => {
    fillOkrugs();
  });

  okrugSelect.addEventListener("change", () => {
    fillLocalities();
  });

  localitySelect.addEventListener("change", () => {
    const locId = localitySelect.value;
    appState.selectedLocation.locality = locId || "";
    checkContinueDisabled();
  });

  continueBtn.addEventListener("click", () => {
    if (continueBtn.disabled) return;

    // сохраняем выбранный KATO
    const region = regions.find((r) => r.id === appState.selectedLocation.region);
    const district = region?.districts.find((d) => d.id === appState.selectedLocation.district);
    const okrug = district?.okrugs.find((o) => o.id === appState.selectedLocation.okrug);
    const locality = okrug?.localities.find((l) => l.id === appState.selectedLocation.locality);
    appState.selectedLocation.kato = locality?.kato || "";

    // ВАЖНО: дальше идём в экран идентификации
    if (appState.clientType === "fl") {
      navigateTo("identify_fl");
    } else if (appState.clientType === "ul") {
      navigateTo("identify_ul");
    } else if (appState.clientType === "supplier") {
      navigateTo("identify_supplier");
    } else {
      // на всякий случай — если clientType потерялся
      navigateTo("home");
    }
  });
}

// ---- Рендер идентификации ФЛ ----
function renderIdentifyFL() {
  const appEl = document.getElementById("app");
  if (!appEl) return;

  appEl.innerHTML = `
    <section>
      <h1>${t("identify_fl_title")}</h1>
      <p>${t("identify_fl_desc")}</p>

      <div class="card">
        <div class="form-grid">
          <div class="form-field">
            <label>${t("identify_fl_account_label")}</label>
            <input type="text" id="fl-account" class="input-text" />
          </div>
        </div>

        <div class="form-actions">
          <button id="btn-fl-submit" class="btn-primary">
            ${t("identify_fl_submit_btn")}
          </button>
        </div>
      </div>
    </section>
  `;

  const accountInput = document.getElementById("fl-account");
  const submitBtn = document.getElementById("btn-fl-submit");

  submitBtn.addEventListener("click", () => {
    const acc = (accountInput.value || "").trim();
    if (!acc) {
      alert(t("identify_error_required"));
      return;
    }

    // мок-проверка: лицевые счета 10001–10005 для г.Астана, Есиль
    const ok = appState.testAccounts.includes(acc);
    if (!ok) {
      if (appState.lang === "kk") {
        alert("Дербес шот табылмады, қолдау қызметіне немесе абоненттік бөлімге хабарласыңыз.");
      } else {
        alert("Лицевой счёт не найден, обратитесь в службу поддержки или абонентский отдел.");
      }
      return;
    }

    // TODO: здесь позже будет реальный fetch /api/check-account
    // пока сохраняем account и идём на выбор услуги
    appState.account = acc;
    navigateTo("choose_service");
  });
}

// ---- Рендер идентификации ЮЛ ----
function renderIdentifyUL() {
  const appEl = document.getElementById("app");
  if (!appEl) return;

  appEl.innerHTML = `
    <section>
      <h1>${t("identify_ul_title")}</h1>
      <p>${t("identify_ul_desc")}</p>

      <div class="card">
        <div class="form-grid">
          <div class="form-field">
            <label>${t("identify_ul_account_label")}</label>
            <input type="text" id="ul-account" class="input-text" />
          </div>

          <div class="form-field">
            <label>${t("identify_ul_contract_label")}</label>
            <input type="text" id="ul-contract" class="input-text" />
          </div>

          <div class="form-field">
            <label>${t("identify_ul_contract_date_label")}</label>
            <input type="date" id="ul-contract-date" class="input-text" />
          </div>
        </div>

        <div class="form-actions">
          <button id="btn-ul-submit" class="btn-primary">
            ${t("identify_ul_submit_btn")}
          </button>
        </div>
      </div>
    </section>
  `;

  const accountInput = document.getElementById("ul-account");
  const contractInput = document.getElementById("ul-contract");
  const dateInput = document.getElementById("ul-contract-date");
  const submitBtn = document.getElementById("btn-ul-submit");

  submitBtn.addEventListener("click", () => {
    const acc = (accountInput.value || "").trim();
    const contract = (contractInput.value || "").trim();
    const contractDate = (dateInput.value || "").trim();

    if (!acc && (!contract || !contractDate)) {
      alert(t("identify_error_required"));
      return;
    }

    if (acc) {
      const ok = appState.testAccounts.includes(acc);
      if (!ok) {
        if (appState.lang === "kk") {
          alert("Дербес шот табылмады, қолдау қызметіне немесе абоненттік бөлімге хабарласыңыз.");
        } else {
          alert("Лицевой счёт не найден, обратитесь в службу поддержки или абонентский отдел.");
        }
        return;
      }
      appState.account = acc;
    } else {
      // мок-проверка договора — считаем, что любой номер+дата валидны
      appState.contract = { number: contract, date: contractDate };
    }

    navigateTo("choose_service");
  });
}

// ---- Рендер идентификации поставщика ----
function renderIdentifySupplier() {
  const appEl = document.getElementById("app");
  if (!appEl) return;

  appEl.innerHTML = `
    <section>
      <h1>${t("identify_supplier_title")}</h1>
      <p>${t("identify_supplier_desc")}</p>

      <div class="card">
        <div class="form-grid">
          <div class="form-field">
            <label>${t("identify_supplier_key_label")}</label>
            <input type="text" id="supplier-key" class="input-text" />
          </div>
        </div>

        <div class="form-actions">
          <button id="btn-supplier-submit" class="btn-primary">
            ${t("identify_supplier_submit_btn")}
          </button>
        </div>
      </div>
    </section>
  `;

  const keyInput = document.getElementById("supplier-key");
  const submitBtn = document.getElementById("btn-supplier-submit");

  submitBtn.addEventListener("click", () => {
    const key = (keyInput.value || "").trim();
    if (!key) {
      alert(t("identify_error_required"));
      return;
    }

    // мок: валидный ключ только DEMO-KEY
    if (key !== "DEMO-KEY") {
      if (appState.lang === "kk") {
        alert("Қолжеткізу кілті жарамсыз.");
      } else {
        alert("Ключ доступа недействителен.");
      }
      return;
    }

    appState.supplierAuthed = true;
    navigateTo("supplier_panel");
  });
}

// ---- Рендер выбора услуги (общий для ФЛ и ЮЛ) ----
function renderChooseService() {
  const appEl = document.getElementById("app");
  if (!appEl) return;

  appEl.innerHTML = `
    <section>
      <h1>${appState.lang === "kk" ? "Қызмет түрін таңдаңыз" : "Выберите услугу"}</h1>
      <p>${appState.lang === "kk"
        ? "Осы дербес шот бойынша қандай қызметтің есептегіш көрсеткіштерін бергіңіз келеді?"
        : "По какому виду услуги вы хотите передать показания счётчика для этого лицевого счёта?"}</p>

      <div class="card">
        <div class="user-type-grid">
          <button class="user-type-btn" data-service="EE">
            ${appState.lang === "kk" ? "Электр энергиясы" : "Электроэнергия"}
          </button>
          <button class="user-type-btn" data-service="HW">
            ${appState.lang === "kk" ? "Ыстық су" : "Горячая вода"}
          </button>
          <button class="user-type-btn" data-service="CW">
            ${appState.lang === "kk" ? "Суық су" : "Холодная вода"}
          </button>
          <button class="user-type-btn" data-service="GAS">
            ${appState.lang === "kk" ? "Газ" : "Газ"}
          </button>
        </div>
      </div>
    </section>
  `;

  appEl.querySelectorAll(".user-type-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const service = btn.getAttribute("data-service");
      appState.service = service;
      // дальше по нашему большому промпту будет экран ввода показаний + фото
      alert(
        appState.lang === "kk"
          ? "Қызмет таңдалды, келесі қадамда есептегіш көрсеткіштерін енгізу беті болады."
          : "Услуга выбрана, на следующем шаге будет экран ввода показаний и фото."
      );
      // navigateTo("input_readings"); // подключим после реализации экрана
    });
  });
}

// ---- Рендер панели поставщика (пока заглушка) ----
function renderSupplierPanel() {
  const appEl = document.getElementById("app");
  if (!appEl) return;

  appEl.innerHTML = `
    <section>
      <h1>${appState.lang === "kk" ? "Таратушы панелі" : "Панель поставщика"}</h1>
      <div class="card">
        <p>
          ${appState.lang === "kk"
            ? "Кілт сәтті тексерілді. Кейін бұл бетте КАТО бойынша есептерді жүктеу мүмкіндігі болады."
            : "Ключ доступа успешно проверен. Позже здесь будет экран для выгрузки отчётов по КАТО."}
        </p>
      </div>
    </section>
  `;
}

// ---- Простые заглушки для About / Contacts / Help ----
function renderSimplePage(titleKey, descKey, fallbackTitle, fallbackDesc) {
  const appEl = document.getElementById("app");
  if (!appEl) return;

  const title = t(titleKey) || fallbackTitle;
  const desc = t(descKey) || fallbackDesc;

  appEl.innerHTML = `
    <section>
      <h1>${title}</h1>
      <div class="card">
        <p>${desc}</p>
      </div>
    </section>
  `;
}

// ---- Главный рендер ----
function renderApp() {
  renderHeader();

  switch (appState.page) {
    case "home":
      renderHome();
      break;
    case "send":
      renderSend();
      break;
    case "identify_fl":
      renderIdentifyFL();
      break;
    case "identify_ul":
      renderIdentifyUL();
      break;
    case "identify_supplier":
      renderIdentifySupplier();
      break;
    case "choose_service":
      renderChooseService();
      break;
    case "supplier_panel":
      renderSupplierPanel();
      break;
    case "about":
      renderSimplePage(
        "about_title",
        "about_desc",
        appState.lang === "kk" ? "Қызмет туралы" : "О сервисе",
        appState.lang === "kk"
          ? "Бұл бетте кейін Abonent.kz сервисі туралы ақпарат болады."
          : "На этой странице позже появится подробная информация о сервисе Abonent.kz."
      );
      break;
    case "contacts":
      renderSimplePage(
        "contacts_title",
        "contacts_desc",
        appState.lang === "kk" ? "Байланыс" : "Контакты",
        appState.lang === "kk"
          ? "Бұл бетте кейін байланыс деректері көрсетіледі."
          : "Здесь позже появятся контактные данные сервиса."
      );
      break;
    case "help":
      renderSimplePage(
        "help_title",
        "help_desc",
        appState.lang === "kk" ? "Анықтама" : "Справка",
        appState.lang === "kk"
          ? "Бұл жерде кейін нұсқаулықтар мен жиі қойылатын сұрақтар орналасады."
          : "Здесь позже появятся инструкции и ответы на частые вопросы."
      );
      break;
    default:
      renderHome();
  }
}

// ---- Старт ----
document.addEventListener("DOMContentLoaded", () => {
  renderApp();
});
