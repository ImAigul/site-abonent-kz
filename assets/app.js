// ===== ГЛОБАЛЬНОЕ СОСТОЯНИЕ =====

const STATE = {
  lang: "kk",
  page: "home",            // home | send | identify_fl | identify_ul | identify_supplier | choose_service | input_readings | supplier_report | result
  clientType: null,        // FL | UL | SUPPLIER
  location: {
    region: null,
    district: null,
    okrug: null,
    locality: null,
    kato: null
  },
  account: null,
  ulData: {
    contractNumber: "",
    contractDate: ""
  },
  supplier: {
    key: "",
    katoList: []
  },
  service: null,           // EE | HW | CW | GAS
  lastReadings: null,      // { value, date } или null
  result: null             // { title, message, isSuccess }
};

// ===== УТИЛИТЫ ТЕКСТОВ =====

function T(key) {
  return (window.TEXTS[STATE.lang] && window.TEXTS[STATE.lang][key]) || key;
}

// Для подстановок {value}, {date}, {service}
function formatText(template, vars = {}) {
  let out = template;
  Object.keys(vars).forEach((k) => {
    out = out.replace(`{${k}}`, vars[k]);
  });
  return out;
}

// Человекочитаемое имя услуги
function serviceLabel(code) {
  const map = {
    EE: { kk: T("service_ee"), ru: T("service_ee") },
    HW: { kk: T("service_hw"), ru: T("service_hw") },
    CW: { kk: T("service_cw"), ru: T("service_cw") },
    GAS:{ kk: T("service_gas"), ru: T("service_gas") }
  };
  const item = map[code];
  if (!item) return "";
  return item[STATE.lang];
}

// Родительный падеж услуги (для success-сообщений)
// Можно доработать позже под конкретную грамматику.
function serviceGenitive(code) {
  if (STATE.lang === "ru") {
    switch (code) {
      case "EE":  return "электроэнергии";
      case "HW":  return "горячей воды";
      case "CW":  return "холодной воды";
      case "GAS": return "газа";
      default:    return "";
    }
  }
  // казахский – ілік септік
  switch (code) {
    case "EE":  return "электр энергиясының";
    case "HW":  return "ыстық судың";
    case "CW":  return "суық судың";
    case "GAS": return "газдың";
    default:    return "";
  }
}

// ===== МИНИ-МОК ДЛЯ КАТО (временно, пока нет API) =====

const MOCK_KATO = {
  regions: [
    {
      id: "astana",
      name_kk: "Астана қ.",
      name_ru: "г. Астана",
      districts: [
        {
          id: "esil",
          name_kk: "Есіл ауданы",
          name_ru: "район Есиль",
          okrugs: [
            {
              id: "esil-okrug-1",
              name_kk: "Есіл а.о.",
              name_ru: "Есиль с.о.",
              localities: [
                {
                  id: "astana-esil-center",
                  kato: "710000000",
                  name_kk: "Астана қ. (Есіл ауданы)",
                  name_ru: "г. Астана (район Есиль)"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// ===== РЕНДЕР ШАПКИ =====

function renderHeader() {
  const lang = STATE.lang;
  const t = (k) => (window.TEXTS[lang] && window.TEXTS[lang][k]) || k;
  const header = document.getElementById("site-header");
  if (!header) return;

  header.innerHTML = `
    <nav class="nav">
      <div class="nav-left">
        <div class="nav-logo-mark">A</div>
        <div class="nav-logo-text">
          <div class="nav-logo-name">Abonent.kz</div>
          <div class="nav-logo-sub">
            ${lang === "kk"
              ? "Коммуналдық көрсеткіштер бойынша бірыңғай шешім"
              : "Единая платформа по коммунальным показаниям"}
          </div>
        </div>
      </div>

      <div class="nav-center">
        <div class="nav-menu">
          <button class="nav-link"
                  data-active="${STATE.page === "home" ? "1" : "0"}"
                  onclick="goHome()">${t("menu_home")}</button>
          <button class="nav-link"
                  data-active="${STATE.page === "send" ? "1" : "0"}"
                  onclick="goSend()">${t("menu_send")}</button>
          <button class="nav-link" onclick="/* reserved */ void 0">
            ${t("menu_about")}
          </button>
          <button class="nav-link" onclick="/* reserved */ void 0">
            ${t("menu_contacts")}
          </button>
          <button class="nav-link" onclick="/* reserved */ void 0">
            ${t("menu_help")}
          </button>
        </div>
      </div>

      <div class="nav-right">
        <span class="nav-lang-label">${lang === "kk" ? "Тіл" : "Язык"}</span>
        <div class="nav-lang">
          <button class="lang-btn"
                  data-active="${lang === "kk" ? "1" : "0"}"
                  onclick="setLang('kk')">KK</button>
          <button class="lang-btn"
                  data-active="${lang === "ru" ? "1" : "0"}"
                  onclick="setLang('ru')">RU</button>
        </div>
      </div>
    </nav>
  `;
}

// ===== МАРШРУТИЗАЦИЯ =====

function setLang(lang) {
  STATE.lang = lang === "ru" ? "ru" : "kk";
  render();
}

function goHome() {
  STATE.page = "home";
  STATE.clientType = null;
  STATE.service = null;
  STATE.account = null;
  STATE.location = {
    region: null, district: null, okrug: null, locality: null, kato: null
  };
  STATE.lastReadings = null;
  STATE.result = null;
  render();
}

function goSend() {
  STATE.page = "send";
  STATE.result = null;
  render();
}

function goIdentifyFl() {
  STATE.page = "identify_fl";
  STATE.result = null;
  render();
}

function goIdentifyUl() {
  STATE.page = "identify_ul";
  STATE.result = null;
  render();
}

function goIdentifySupplier() {
  STATE.page = "identify_supplier";
  STATE.result = null;
  render();
}

function goChooseService() {
  STATE.page = "choose_service";
  STATE.service = null;
  STATE.lastReadings = null;
  render();
}

function goInputReadings() {
  STATE.page = "input_readings";
  STATE.lastReadings = null;
  fetchLastReadings();
  render();
}

function goResult() {
  STATE.page = "result";
  render();
}

function goSupplierReport() {
  STATE.page = "supplier_report";
  render();
}

// ===== РЕНДЕР СТРАНИЦ =====

function render() {
  renderHeader();
  const root = document.getElementById("app");
  if (!root) return;

  let content = "";
  switch (STATE.page) {
    case "home":             content = renderHomePage(); break;
    case "send":             content = renderSendPage(); break;
    case "identify_fl":      content = renderIdentifyFlPage(); break;
    case "identify_ul":      content = renderIdentifyUlPage(); break;
    case "identify_supplier":content = renderIdentifySupplierPage(); break;
    case "choose_service":   content = renderChooseServicePage(); break;
    case "input_readings":   content = renderInputReadingsPage(); break;
    case "supplier_report":  content = renderSupplierReportPage(); break;
    case "result":           content = renderResultPage(); break;
    default:                 content = renderHomePage();
  }

  root.innerHTML = `
    <div class="main-inner">
      <section class="main-card">
        ${content}
      </section>
      <aside class="main-aside">
        <div>
          <div class="main-aside-title">
            ${STATE.lang === "kk" ? "Сенімді платформа" : "Надёжный сервис"}
          </div>
          <div class="main-aside-text">
            ${STATE.lang === "kk"
              ? "Abonent.kz – тұрғындар, бизнес және қызмет көрсетушілер үшін есептегіш көрсеткіштерін қауіпсіз қабылдау және өңдеу алаңы."
              : "Abonent.kz — безопасная площадка для приёма и обработки показаний счётчиков для жителей, бизнеса и поставщиков услуг."}
          </div>
        </div>
        <div class="main-aside-badges">
          <span class="badge">${STATE.lang === "kk" ? "24/7 қолжетімділік" : "Доступ 24/7"}</span>
          <span class="badge">${STATE.lang === "kk" ? "Қосарланған верификация" : "Двойная верификация"}</span>
          <span class="badge">${STATE.lang === "kk" ? "Фото + сандық дерек" : "Фото + цифровые данные"}</span>
        </div>
      </aside>
    </div>
  `;
}

// --- Домашняя страница ---

function renderHomePage() {
  const lang = STATE.lang;
  return `
    <h1 class="page-title">${T("home_title")}</h1>
    <p class="page-desc">${T("home_desc")}</p>
    <div class="card-section">
      <h2 class="card-title-small">${T("home_service_title")}</h2>
      <div class="home-service-grid">
        <button class="home-service-btn" onclick="selectClientType('FL')">
          <div>${T("home_btn_fl")}</div>
          <span>${lang === "kk" ? "Пәтер, жеке үй" : "Жители, квартиры, частные дома"}</span>
        </button>
        <button class="home-service-btn" onclick="selectClientType('UL')">
          <div>${T("home_btn_ul")}</div>
          <span>${lang === "kk" ? "Компаниялар мен ұйымдар" : "Компании и организации"}</span>
        </button>
        <button class="home-service-btn" onclick="selectClientType('SUPPLIER')">
          <div>${T("home_btn_supplier")}</div>
          <span>${lang === "kk" ? "Таратушылар мен қызмет көрсетушілер" : "Поставщики и операторы услуг"}</span>
        </button>
      </div>
    </div>
  `;
}

function selectClientType(type) {
  STATE.clientType = type;
  STATE.page = "send";
  render();
}

// --- Страница выбора населённого пункта ---

function renderSendPage() {
  const t = T;
  const lang = STATE.lang;

  const regions = MOCK_KATO.regions;
  const regionOptions = ['<option value="">—</option>']
    .concat(regions.map(r => `
      <option value="${r.id}">${lang === "kk" ? r.name_kk : r.name_ru}</option>
    `)).join("");

  const region = regions.find(r => r.id === STATE.location.region);
  const districts = region ? region.districts : [];
  const districtOptions = ['<option value="">—</option>']
    .concat(districts.map(d => `
      <option value="${d.id}">${lang === "kk" ? d.name_kk : d.name_ru}</option>
    `)).join("");

  const district = districts.find(d => d.id === STATE.location.district);
  const okrugs = district ? district.okrugs : [];
  const okrugOptions = ['<option value="">—</option>']
    .concat(okrugs.map(o => `
      <option value="${o.id}">${lang === "kk" ? o.name_kk : o.name_ru}</option>
    `)).join("");

  const okrug = okrugs.find(o => o.id === STATE.location.okrug);
  const localities = okrug ? okrug.localities : [];
  const localityOptions = ['<option value="">—</option>']
    .concat(localities.map(l => `
      <option value="${l.id}">${lang === "kk" ? l.name_kk : l.name_ru}</option>
    `)).join("");

  const canContinue = Boolean(STATE.location.locality);

  return `
    <h1 class="page-title">${t("send_title")}</h1>
    <p class="page-desc">${t("send_desc")}</p>

    <div class="form-grid">
      <div class="form-field">
        <label class="form-label">${t("send_region_label")}</label>
        <select class="form-select" onchange="onRegionChange(this.value)">
          ${regionOptions}
        </select>
      </div>

      <div class="form-field">
        <label class="form-label">${t("send_district_label")}</label>
        <select class="form-select" onchange="onDistrictChange(this.value)">
          ${districtOptions}
        </select>
      </div>

      <div class="form-field">
        <label class="form-label">${t("send_okrug_label")}</label>
        <select class="form-select" onchange="onOkrugChange(this.value)">
          ${okrugOptions}
        </select>
      </div>

      <div class="form-field">
        <label class="form-label">${t("send_locality_label")}</label>
        <select class="form-select" onchange="onLocalityChange(this.value)">
          ${localityOptions}
        </select>
      </div>
    </div>

    <div class="form-actions">
      <button class="btn-primary"
              ${canContinue ? "" : "disabled"}
              onclick="onLocationContinue()">
        ${t("send_continue_btn")}
      </button>
    </div>
  `;
}

function onRegionChange(regionId) {
  STATE.location.region = regionId || null;
  STATE.location.district = null;
  STATE.location.okrug = null;
  STATE.location.locality = null;
  STATE.location.kato = null;
  render();
}

function onDistrictChange(districtId) {
  STATE.location.district = districtId || null;
  STATE.location.okrug = null;
  STATE.location.locality = null;
  STATE.location.kato = null;
  render();
}

function onOkrugChange(okrugId) {
  STATE.location.okrug = okrugId || null;
  STATE.location.locality = null;
  STATE.location.kato = null;
  render();
}

function onLocalityChange(localityId) {
  STATE.location.locality = localityId || null;
  const region = MOCK_KATO.regions.find(r => r.id === STATE.location.region);
  const district = region?.districts.find(d => d.id === STATE.location.district);
  const okrug = district?.okrugs.find(o => o.id === STATE.location.okrug);
  const locality = okrug?.localities.find(l => l.id === localityId);
  STATE.location.kato = locality?.kato || null;
  render();
}

function onLocationContinue() {
  if (!STATE.location.kato) return;
  if (STATE.clientType === "FL")      goIdentifyFl();
  else if (STATE.clientType === "UL") goIdentifyUl();
  else                                goIdentifySupplier();
}

// --- Идентификация ФЛ ---

function renderIdentifyFlPage() {
  const t = T;
  const err = STATE._error || "";
  const acc = STATE.account || "";
  return `
    <h1 class="page-title">${t("identify_fl_title")}</h1>
    <p class="page-desc">${t("identify_fl_desc")}</p>

    <div class="form-grid">
      <div class="form-field">
        <label class="form-label">${t("identify_fl_account_label")}</label>
        <input class="form-control"
               value="${acc}"
               oninput="STATE.account=this.value.trim()">
      </div>
      ${err ? `<div class="form-error">${err}</div>` : ""}
    </div>

    <div class="form-actions">
      <button class="btn-primary" onclick="submitIdentifyFl()">
        ${t("identify_fl_submit_btn")}
      </button>
    </div>
  `;
}

async function submitIdentifyFl() {
  const t = T;
  const acc = (STATE.account || "").trim();
  if (!acc) {
    STATE._error = t("msg_required");
    render();
    return;
  }

  try {
    const res = await fetch("/api/check-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        account: acc,
        kato: STATE.location.kato,
        clientType: "FL"
      })
    });
    const data = await res.json().catch(() => ({}));

    if (data && data.found) {
      STATE._error = "";
      goChooseService();
    } else {
      STATE._error = t("msg_account_not_found");
      render();
    }
  } catch (e) {
    STATE._error = t("msg_generic_error");
    render();
  }
}

// --- Идентификация ЮЛ ---

function renderIdentifyUlPage() {
  const t = T;
  const err = STATE._error || "";
  return `
    <h1 class="page-title">${t("identify_ul_title")}</h1>
    <p class="page-desc">${t("identify_ul_desc")}</p>

    <div class="form-grid">
      <div class="form-field">
        <label class="form-label">${t("identify_ul_account_label")} <small>(опционально)</small></label>
        <input class="form-control"
               value="${STATE.account || ""}"
               oninput="STATE.account=this.value.trim()">
      </div>

      <div class="form-field">
        <label class="form-label">${t("identify_ul_contract_label")} <small>(если нет лицевого счёта)</small></label>
        <input class="form-control"
               value="${STATE.ulData.contractNumber}"
               oninput="STATE.ulData.contractNumber=this.value.trim()">
      </div>

      <div class="form-field">
        <label class="form-label">${t("identify_ul_contract_date_label")}</label>
        <input type="date"
               class="form-control"
               value="${STATE.ulData.contractDate}"
               oninput="STATE.ulData.contractDate=this.value">
      </div>

      ${err ? `<div class="form-error">${err}</div>` : ""}
    </div>

    <div class="form-actions">
      <button class="btn-primary" onclick="submitIdentifyUl()">
        ${t("identify_ul_submit_btn")}
      </button>
    </div>
  `;
}

async function submitIdentifyUl() {
  const t = T;
  const acc = (STATE.account || "").trim();
  const num = (STATE.ulData.contractNumber || "").trim();
  const date = (STATE.ulData.contractDate || "").trim();

  if (!acc && (!num || !date)) {
    STATE._error = t("msg_required");
    render();
    return;
  }

  try {
    const res = await fetch("/api/check-account-ul", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        account: acc || null,
        contractNumber: num || null,
        contractDate: date || null,
        kato: STATE.location.kato,
        clientType: "UL"
      })
    });

    const data = await res.json().catch(() => ({}));

    if (data && data.found) {
      STATE._error = "";
      // account может прийти из договора
      if (data.account) STATE.account = data.account;
      goChooseService();
    } else {
      STATE._error = acc ? t("msg_account_not_found") : t("msg_contract_not_found");
      render();
    }
  } catch (e) {
    STATE._error = t("msg_generic_error");
    render();
  }
}

// --- Идентификация Поставщика ---

function renderIdentifySupplierPage() {
  const t = T;
  const err = STATE._error || "";
  return `
    <h1 class="page-title">${t("identify_supplier_title")}</h1>
    <p class="page-desc">${t("identify_supplier_desc")}</p>

    <div class="form-grid">
      <div class="form-field">
        <label class="form-label">${t("identify_supplier_key_label")}</label>
        <input class="form-control"
               value="${STATE.supplier.key || ""}"
               oninput="STATE.supplier.key=this.value.trim()">
      </div>
      ${err ? `<div class="form-error">${err}</div>` : ""}
    </div>

    <div class="form-actions">
      <button class="btn-primary" onclick="submitIdentifySupplier()">
        ${t("identify_supplier_submit_btn")}
      </button>
    </div>
  `;
}

async function submitIdentifySupplier() {
  const t = T;
  const key = (STATE.supplier.key || "").trim();
  if (!key) {
    STATE._error = t("msg_required");
    render();
    return;
  }

  try {
    const res = await fetch("/api/supplier/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        kato: STATE.location.kato
      })
    });
    const data = await res.json().catch(() => ({}));

    if (data && data.ok) {
      STATE._error = "";
      STATE.supplier.katoList = data.katos || [STATE.location.kato];
      goSupplierReport();
    } else {
      STATE._error = t("msg_supplier_key_error");
      render();
    }
  } catch (e) {
    STATE._error = t("msg_generic_error");
    render();
  }
}

// --- Выбор услуги ---

function renderChooseServicePage() {
  const t = T;
  const lang = STATE.lang;
  const locName = getLocationDisplayName();
  const acct = STATE.account || "";

  return `
    <h1 class="page-title">${t("service_title")}</h1>
    <p class="page-desc">${t("service_desc")}</p>

    <div class="card-section">
      <p class="form-note">
        ${lang === "kk"
          ? `Елді мекен: ${locName || "-"}, дербес шот: ${acct || "-"}.`
          : `Населённый пункт: ${locName || "-"}, лицевой счёт: ${acct || "-"}.`}
      </p>

      <div class="home-service-grid">
        <button class="home-service-btn" onclick="selectService('EE')">
          <div>${t("service_ee")}</div>
          <span>${lang === "kk" ? "Электр энергиясы" : "Электроснабжение"}</span>
        </button>
        <button class="home-service-btn" onclick="selectService('HW')">
          <div>${t("service_hw")}</div>
          <span>${lang === "kk" ? "Орталықтандырылған ыстық су" : "Централизованная ГВС"}</span>
        </button>
        <button class="home-service-btn" onclick="selectService('CW')">
          <div>${t("service_cw")}</div>
          <span>${lang === "kk" ? "Суық су, ауыз су" : "ХВС / питьевая вода"}</span>
        </button>
        <button class="home-service-btn" onclick="selectService('GAS')">
          <div>${t("service_gas")}</div>
          <span>${lang === "kk" ? "Газбен жабдықтау" : "Газоснабжение"}</span>
        </button>
      </div>
    </div>
  `;
}

function selectService(code) {
  STATE.service = code;
  goInputReadings();
}

// --- Ввод показаний ---

function getLocationDisplayName() {
  const lang = STATE.lang;
  const region = MOCK_KATO.regions.find(r => r.id === STATE.location.region);
  const district = region?.districts.find(d => d.id === STATE.location.district);
  const okrug = district?.okrugs.find(o => o.id === STATE.location.okrug);
  const locality = okrug?.localities.find(l => l.id === STATE.location.locality);
  if (!locality) return "";
  return lang === "kk" ? locality.name_kk : locality.name_ru;
}

async function fetchLastReadings() {
  try {
    if (!STATE.account || !STATE.service) {
      STATE.lastReadings = null;
      return;
    }
    const params = new URLSearchParams({
      account: STATE.account,
      service: STATE.service
    });
    const res = await fetch(`/api/last-readings?${params.toString()}`);
    const data = await res.json().catch(() => null);
    if (data && data.value != null && data.date) {
      STATE.lastReadings = { value: data.value, date: data.date };
    } else {
      STATE.lastReadings = null;
    }
    render();
  } catch {
    STATE.lastReadings = null;
  }
}

function renderInputReadingsPage() {
  const t = T;
  const lang = STATE.lang;
  const loc = getLocationDisplayName();
  const acc = STATE.account || "";
  const serviceName = serviceLabel(STATE.service);
  const prev = STATE.lastReadings;
  const err = STATE._error || "";

  return `
    <h1 class="page-title">${t("readings_title")}</h1>
    <p class="page-desc">
      ${lang === "kk"
        ? "Көрсеткіштерді енгізіп, есептегіштің анық фотосын тіркеңіз."
        : "Введите показания и прикрепите чёткую фотографию счётчика."}
    </p>

    <div class="form-grid">
      <div class="form-note">
        <strong>${t("readings_account")}</strong> ${acc || "-"}<br/>
        <strong>${t("readings_location")}</strong> ${loc || "-"}<br/>
        <strong>${t("readings_service")}</strong> ${serviceName || "-"}
      </div>

      ${prev ? `
        <div class="prev-readings">
          ${formatText(t("readings_prev_label"), {
            value: prev.value,
            date: prev.date
          })}
        </div>
      ` : ""}

      <div class="form-field">
        <label class="form-label">${t("readings_value_label")}</label>
        <input id="readings-value"
               class="form-control"
               inputmode="decimal"
               placeholder="0"
               oninput="onChangeReadingValue(this.value)">
        <div class="form-note-accent">${t("readings_hint_period")}</div>
      </div>

      <div class="form-field">
        <label class="form-label">${t("readings_file_label")}</label>
        <div class="form-file">
          <input id="readings-photo"
                 type="file"
                 accept="image/*"
                 onchange="onChangeReadingFile(this.files)">
          <span class="form-note">
            ${lang === "kk"
              ? "JPG немесе PNG форматындағы түсінікті фото"
              : "Чёткое фото в формате JPG или PNG"}
          </span>
        </div>
      </div>

      ${err ? `<div class="form-error">${err}</div>` : ""}
    </div>

    <div class="form-actions">
      <button id="readings-submit-btn"
              class="btn-primary"
              disabled
              onclick="submitReadings()">
        ${t("readings_submit_btn")}
      </button>
    </div>
  `;
}

let _readingValue = "";
let _readingFile = null;

function onChangeReadingValue(val) {
  _readingValue = val.trim();
  updateReadingsSubmitState();
}

function onChangeReadingFile(files) {
  _readingFile = files && files[0] ? files[0] : null;
  updateReadingsSubmitState();
}

function updateReadingsSubmitState() {
  const btn = document.getElementById("readings-submit-btn");
  if (!btn) return;
  const can = _readingValue && _readingFile;
  btn.disabled = !can;
}

async function submitReadings(force = false) {
  const t = T;
  if (!_readingValue || !_readingFile) {
    STATE._error = t("msg_required");
    render();
    return;
  }

  const form = new FormData();
  form.append("account", STATE.account || "");
  form.append("kato", STATE.location.kato || "");
  form.append("service", STATE.service || "");
  form.append("value", _readingValue);
  form.append("force", force ? "1" : "0");
  form.append("photo", _readingFile);

  try {
    const res = await fetch("/api/send-readings", {
      method: "POST",
      body: form
    });
    const data = await res.json().catch(() => ({}));

    if (data.status === "ok" || data.status === "accepted") {
      const cnt = data.meterCount || 1;
      const gen = serviceGenitive(STATE.service);
      const msg = cnt > 1
        ? formatText(T("success_multi"), { service: gen })
        : formatText(T("success_single"), { service: gen });

      STATE.result = {
        isSuccess: true,
        title: "",
        message: msg
      };
      STATE._error = "";
      goResult();
    } else if (data.status === "need_confirm") {
      // спец-кейс: подтверждение меньших показаний.
      const msg = data.message || t("msg_generic_error");
      STATE.result = {
        isSuccess: false,
        title: "",
        message: msg,
        needConfirm: true
      };
      renderConfirmLower(data.message);
    } else {
      STATE._error = data.message || t("msg_generic_error");
      render();
    }
  } catch (e) {
    STATE._error = t("msg_generic_error");
    render();
  }
}

// отдельный рендер спец-кейса "need_confirm"
function renderConfirmLower(messageText) {
  const root = document.getElementById("app");
  if (!root) return;
  const msg = messageText || T("msg_generic_error");
  root.querySelector(".main-card");
  document.getElementById("app").innerHTML = `
    <div class="main-inner">
      <section class="main-card">
        <div class="result-block">
          <div class="result-msg">${msg}</div>
          <div class="form-actions">
            <button class="btn-secondary" onclick="goInputReadings()">
              ${STATE.lang === "kk" ? "Деректерді түзету" : "Изменить данные"}
            </button>
            <button class="btn-primary" onclick="submitReadings(true)">
              ${STATE.lang === "kk" ? "Растау және жіберу" : "Подтвердить и отправить"}
            </button>
          </div>
        </div>
      </section>
      <aside class="main-aside">${document.querySelector(".main-aside")?.innerHTML || ""}</aside>
    </div>
  `;
}

// --- Экран результата ---

function renderResultPage() {
  const t = T;
  const lang = STATE.lang;
  const res = STATE.result || { isSuccess: true, message: "" };

  return `
    <div class="result-block">
      <h1 class="page-title">
        ${res.isSuccess
          ? (lang === "kk" ? "Көрсеткіштер қабылданды" : "Показания приняты")
          : (lang === "kk" ? "Хабарлама" : "Сообщение")}
      </h1>
      <p class="result-msg">${res.message || ""}</p>

      <div class="form-actions">
        <button class="btn-secondary" onclick="goChooseService()">
          ${t("btn_more_readings")}
        </button>
        <button class="btn-primary" onclick="goHome()">
          ${t("btn_home")}
        </button>
      </div>
    </div>
  `;
}

// --- Экран поставщика: отчёт ---

function renderSupplierReportPage() {
  const t = T;
  const lang = STATE.lang;
  const err = STATE._error || "";

  const options = (STATE.supplier.katoList || []).map((k) => `
    <option value="${k}">${k}</option>
  `).join("");

  return `
    <h1 class="page-title">${t("supplier_report_title")}</h1>
    <p class="page-desc">${t("supplier_report_desc")}</p>

    <div class="form-grid">
      <div class="form-field">
        <label class="form-label">${t("supplier_kato_label")}</label>
        <select id="supplier-kato" class="form-select">
          ${options}
        </select>
      </div>

      <div class="form-field">
        <label class="form-label">${t("supplier_from_label")}</label>
        <input id="supplier-from"
               type="date"
               class="form-control">
      </div>

      <div class="form-field">
        <label class="form-label">${t("supplier_to_label")}</label>
        <input id="supplier-to"
               type="date"
               class="form-control">
      </div>

      <div class="form-field">
        <label class="form-label">${t("supplier_format_label")}</label>
        <select id="supplier-format" class="form-select">
          <option value="csv">${t("supplier_format_csv")}</option>
          <option value="xlsx">${t("supplier_format_xlsx")}</option>
        </select>
      </div>

      ${err ? `<div class="form-error">${err}</div>` : ""}
    </div>

    <div class="form-actions">
      <button class="btn-primary" onclick="submitSupplierReport()">
        ${t("supplier_report_btn")}
      </button>
      <button class="btn-secondary" onclick="goHome()">
        ${t("btn_home")}
      </button>
    </div>
  `;
}

async function submitSupplierReport() {
  const t = T;
  const katoEl   = document.getElementById("supplier-kato");
  const fromEl   = document.getElementById("supplier-from");
  const toEl     = document.getElementById("supplier-to");
  const formatEl = document.getElementById("supplier-format");

  const kato   = katoEl?.value;
  const from   = fromEl?.value;
  const to     = toEl?.value;
  const format = formatEl?.value || "csv";

  if (!kato || !from || !to) {
    STATE._error = t("msg_required");
    render();
    return;
  }

  try {
    const params = new URLSearchParams({
      kato,
      from,
      to,
      format
    });
    const res = await fetch(`/api/supplier/report?${params.toString()}`);
    if (!res.ok) throw new Error("HTTP");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${kato}-${from}-${to}.${format === "xlsx" ? "xlsx" : "csv"}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    STATE._error = "";
    render();
  } catch (e) {
    STATE._error = t("msg_generic_error");
    render();
  }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

document.addEventListener("DOMContentLoaded", () => {
  render();
});

// делаем функции доступными из HTML
window.setLang = setLang;
window.goHome = goHome;
window.goSend = goSend;
window.selectClientType = selectClientType;
window.onRegionChange = onRegionChange;
window.onDistrictChange = onDistrictChange;
window.onOkrugChange = onOkrugChange;
window.onLocalityChange = onLocalityChange;
window.onLocationContinue = onLocationContinue;
window.submitIdentifyFl = submitIdentifyFl;
window.submitIdentifyUl = submitIdentifyUl;
window.submitIdentifySupplier = submitIdentifySupplier;
window.selectService = selectService;
window.onChangeReadingValue = onChangeReadingValue;
window.onChangeReadingFile = onChangeReadingFile;
window.submitReadings = submitReadings;
window.goChooseService = goChooseService;
window.goInputReadings = goInputReadings;
window.goHome = goHome;
window.submitSupplierReport = submitSupplierReport;
