(() => {
  const texts = window.ABONENT_TEXTS;

  const state = {
    lang: localStorage.getItem("abonent_lang") || "ru",
    currentPage: "home", // home | send | input_account | ul_identify | choose_service | input_readings | supplier_key | supplier_report
    clientType: null, // FL | UL | SUPPLIER
    selectedLocation: {
      level1: "",
      level2: "",
      level3: "",
      level4: "",
      kato: ""
    },
    account: "",
    ul: {
      account: "",
      contractNumber: "",
      contractDate: ""
    },
    selectedService: null, // EE | HW | CW | GAS
    previousReading: null,
    readingsValue: "",
    readingsFile: null,
    readingsFileName: "",
    ulCounters: [
      { id: 1, value: "", file: null, fileName: "" }
    ],
    supplier: {
      accessKey: "",
      katoList: [],
      selectedKato: "",
      from: "",
      to: "",
      format: "csv"
    },
    lastErrorCode: null,
    lastErrorMessage: null,
    lastInfoMessage: null,
    lastSuccessMessage: null,
    decreasedWarning: false,
    loading: false
  };

  const apiBase = (typeof window !== "undefined" && window.ABONENT_API_BASE) ||
    (typeof location !== "undefined"
      ? `${location.origin.replace(/\/$/, "")}`
      : "");

  function setLang(lang) {
    state.lang = lang;
    localStorage.setItem("abonent_lang", lang);
    render();
  }

  function setPage(page) {
    state.currentPage = page;
    state.lastErrorCode = null;
    state.lastErrorMessage = null;
    state.lastInfoMessage = null;
    state.lastSuccessMessage = null;
    state.decreasedWarning = false;
    render();
  }

  function t(path) {
    const parts = path.split(".");
    let obj = texts[state.lang];
    for (const p of parts) {
      if (!obj) return "";
      obj = obj[p];
    }
    return obj || "";
  }

  function getServiceLabel(code) {
    if (state.lang === "ru") {
      if (code === "EE") return texts.ru.chooseService.ee;
      if (code === "HW") return texts.ru.chooseService.hw;
      if (code === "CW") return texts.ru.chooseService.cw;
      if (code === "GAS") return texts.ru.chooseService.gas;
    } else {
      if (code === "EE") return texts.kz.chooseService.ee;
      if (code === "HW") return texts.kz.chooseService.hw;
      if (code === "CW") return texts.kz.chooseService.cw;
      if (code === "GAS") return texts.kz.chooseService.gas;
    }
    return code;
  }

  function getServiceGenitive(code) {
    return texts[state.lang].serviceGenitive[code] || "";
  }

  // Моки для каскадного выбора КАТО (минимальный пример)
  const MOCK_KATO = [
    {
      id: "01",
      nameRu: "Астана",
      nameKz: "Астана",
      children: [
        {
          id: "0101",
          nameRu: "Район 1",
          nameKz: "1 аудан",
          children: [
            {
              id: "010101",
              nameRu: "Сельский округ 1",
              nameKz: "1 ауылдық округ",
              children: [
                {
                  id: "01010101",
                  kato: "01010101",
                  nameRu: "Населенный пункт 1",
                  nameKz: "Елді мекен 1"
                }
              ]
            }
          ]
        }
      ]
    }
  ];

  function getKatoOptions(level, parentIds) {
    if (level === 1) {
      return MOCK_KATO.map(r => ({
        id: r.id,
        nameRu: r.nameRu,
        nameKz: r.nameKz
      }));
    }
    if (level === 2) {
      const region = MOCK_KATO.find(r => r.id === parentIds.level1);
      return region
        ? region.children.map(d => ({
            id: d.id,
            nameRu: d.nameRu,
            nameKz: d.nameKz
          }))
        : [];
    }
    if (level === 3) {
      const region = MOCK_KATO.find(r => r.id === parentIds.level1);
      const district = region?.children.find(d => d.id === parentIds.level2);
      return district
        ? district.children.map(s => ({
            id: s.id,
            nameRu: s.nameRu,
            nameKz: s.nameKz
          }))
        : [];
    }
    if (level === 4) {
      const region = MOCK_KATO.find(r => r.id === parentIds.level1);
      const district = region?.children.find(d => d.id === parentIds.level2);
      const rural = district?.children.find(s => s.id === parentIds.level3);
      return rural
        ? rural.children.map(v => ({
            id: v.id,
            kato: v.kato,
            nameRu: v.nameRu,
            nameKz: v.nameKz
          }))
        : [];
    }
    return [];
  }

  async function apiPostJson(path, body) {
    state.loading = true;
    render();
    try {
      const res = await fetch(apiBase + path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      state.loading = false;
      return data;
    } catch (e) {
      state.loading = false;
      state.lastErrorMessage = texts[state.lang].generic.errorGeneric;
      render();
      return null;
    }
  }

  async function apiGet(path) {
    state.loading = true;
    render();
    try {
      const res = await fetch(apiBase + path);
      const data = await res.json();
      state.loading = false;
      return data;
    } catch (e) {
      state.loading = false;
      state.lastErrorMessage = texts[state.lang].generic.errorGeneric;
      render();
      return null;
    }
  }

  async function apiSendReadingsSingle({
    account,
    kato,
    service,
    value,
    file
  }) {
    state.loading = true;
    render();
    try {
      const fd = new FormData();
      fd.append("account", account);
      fd.append("kato", kato);
      fd.append("service", service);
      fd.append("value", value);
      if (file) {
        fd.append("photo", file);
      }

      const res = await fetch(apiBase + "/api/send-readings", {
        method: "POST",
        body: fd
      });
      const data = await res.json();
      state.loading = false;
      return data;
    } catch (e) {
      state.loading = false;
      state.lastErrorMessage = texts[state.lang].generic.errorGeneric;
      render();
      return null;
    }
  }

  async function handleCheckAccountFL() {
    if (!state.account.trim()) return;
    const resp = await apiPostJson("/api/check-account", {
      account: state.account.trim(),
      kato: state.selectedLocation.kato,
      clientType: "FL"
    });
    if (!resp) return;
    if (resp.found) {
      state.lastErrorMessage = null;
      state.lastInfoMessage = null;
      state.previousReading = null;
      setPage("choose_service");
    } else {
      state.lastErrorMessage = texts[state.lang].inputAccount.notFound;
      render();
    }
  }

  async function handleCheckUL() {
    const langBlock = texts[state.lang].ul;

    const acc = state.ul.account.trim();
    const num = state.ul.contractNumber.trim();
    const date = state.ul.contractDate.trim();

    if (!acc && (!num || !date)) {
      state.lastErrorMessage = langBlock.errorEmpty;
      render();
      return;
    }

    if (acc) {
      const resp = await apiPostJson("/api/check-account", {
        account: acc,
        kato: state.selectedLocation.kato,
        clientType: "UL"
      });
      if (!resp) return;
      if (!resp.found) {
        state.lastErrorMessage = langBlock.errorAccountNotFound;
        render();
        return;
      }
      state.account = acc;
    } else {
      const resp = await apiPostJson("/api/check-contract", {
        contractNumber: num,
        contractDate: date
      });
      if (!resp) return;
      if (!resp.found || !resp.account) {
        state.lastErrorMessage = langBlock.errorContractNotFound;
        render();
        return;
      }
      state.account = resp.account;
    }

    state.lastErrorMessage = null;
    state.ulCounters = [{ id: 1, value: "", file: null, fileName: "" }];
    setPage("choose_service");
  }

  async function fetchLastReadings() {
    if (!state.account || !state.selectedService) return;
    const q = `/api/last-readings?account=${encodeURIComponent(
      state.account
    )}&service=${encodeURIComponent(state.selectedService)}`;
    const resp = await apiGet(q);
    if (resp && resp.found) {
      state.previousReading = {
        value: resp.value,
        date: resp.date
      };
    } else {
      state.previousReading = null;
    }
    render();
  }

  function handleOcrError(code) {
    const o = texts[state.lang].ocr;
    if (code === "OCR_UNREADABLE") {
      state.lastErrorMessage = o.unreadable;
    } else if (code === "OCR_MISMATCH") {
      state.lastErrorMessage = o.mismatch;
    } else if (code === "OCR_ATTEMPTS_EXCEEDED") {
      state.lastErrorMessage = o.attemptsExceeded;
    } else {
      state.lastErrorMessage = texts[state.lang].generic.errorGeneric;
    }
  }

  async function handleSendReadingsFL() {
    if (!state.readingsValue.trim() || !state.readingsFile) return;

    const resp = await apiSendReadingsSingle({
      account: state.account,
      kato: state.selectedLocation.kato,
      service: state.selectedService,
      value: state.readingsValue.trim(),
      file: state.readingsFile
    });
    if (!resp) return;

    if (resp.error) {
      if (resp.code && resp.code.startsWith("OCR_")) {
        handleOcrError(resp.code);
        render();
        return;
      }
      if (resp.code === "DATE_OUT_OF_RANGE") {
        state.lastErrorMessage = texts[state.lang].inputAccount.warning;
        render();
        return;
      }
      if (resp.code === "VALUE_DECREASED") {
        state.decreasedWarning = true;
        state.lastErrorMessage = texts[state.lang].ocr.decreasedWarning;
        render();
        return;
      }
      state.lastErrorMessage = texts[state.lang].generic.errorGeneric;
      render();
      return;
    }

    state.lastErrorMessage = null;
    state.decreasedWarning = false;
    state.lastSuccessMessage = texts[state.lang].inputReadings.success;
    render();
  }

  async function handleForceSendReadingsFL() {
    if (!state.readingsValue.trim() || !state.readingsFile) return;

    const resp = await apiSendReadingsSingle({
      account: state.account,
      kato: state.selectedLocation.kato,
      service: state.selectedService,
      value: state.readingsValue.trim(),
      file: state.readingsFile
    });
    if (!resp) return;

    if (resp.error) {
      if (resp.code && resp.code.startsWith("OCR_")) {
        handleOcrError(resp.code);
        render();
        return;
      }
      state.lastErrorMessage = texts[state.lang].generic.errorGeneric;
      render();
      return;
    }

    state.lastErrorMessage = null;
    state.decreasedWarning = false;
    state.lastSuccessMessage = texts[state.lang].inputReadings.success;
    render();
  }

  async function handleSendReadingsUL() {
    const validCounters = state.ulCounters.filter(
      c => c.value.trim() && c.file
    );
    if (!validCounters.length) return;

    for (const c of validCounters) {
      const resp = await apiSendReadingsSingle({
        account: state.account,
        kato: state.selectedLocation.kato,
        service: state.selectedService,
        value: c.value.trim(),
        file: c.file
      });
      if (!resp) return;
      if (resp.error) {
        if (resp.code && resp.code.startsWith("OCR_")) {
          handleOcrError(resp.code);
          render();
          return;
        }
        state.lastErrorMessage = texts[state.lang].generic.errorGeneric;
        render();
        return;
      }
    }

    state.lastErrorMessage = null;
    state.lastSuccessMessage = texts[state.lang].ul.successFinal;
    render();
  }

  async function handleSupplierLogin() {
    if (!state.supplier.accessKey.trim()) return;
    const resp = await apiPostJson("/api/check-supplier-key", {
      key: state.supplier.accessKey.trim()
    });
    if (!resp) return;
    if (!resp.valid) {
      state.lastErrorMessage = texts[state.lang].supplier.keyError;
      render();
      return;
    }
    state.supplier.katoList = resp.katoList || [];
    state.supplier.selectedKato = resp.katoList?.[0] || "";
    state.lastErrorMessage = null;
    setPage("supplier_report");
  }

  async function handleSupplierReport() {
    const sup = state.supplier;
    if (!sup.selectedKato || !sup.from || !sup.to) return;

    const url =
      apiBase +
      `/api/supplier-report?kato=${encodeURIComponent(
        sup.selectedKato
      )}&from=${encodeURIComponent(sup.from)}&to=${encodeURIComponent(
        sup.to
      )}&format=${encodeURIComponent(sup.format)}`;

    state.loading = true;
    render();
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      state.loading = false;

      const a = document.createElement("a");
      const objUrl = URL.createObjectURL(blob);
      a.href = objUrl;
      a.download =
        sup.format === "xlsx" ? "report.xlsx" : "report.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } catch (e) {
      state.loading = false;
      state.lastErrorMessage = texts[state.lang].generic.errorGeneric;
      render();
    }
  }

  function renderMenu() {
    const menuEl = document.getElementById("main-menu");
    if (!menuEl) return;
    const items = [
      { page: "home", label: t("menu.home") },
      { page: "send", label: t("menu.send") },
      { page: "about", label: t("menu.about") },
      { page: "contacts", label: t("menu.contacts") },
      { page: "faq", label: t("menu.faq") }
    ];
    menuEl.innerHTML = "";
    items.forEach(item => {
      const btn = document.createElement("button");
      btn.textContent = item.label;
      if (state.currentPage === item.page) {
        btn.classList.add("active");
      }
      btn.addEventListener("click", () => {
        if (item.page === "home") {
          state.clientType = null;
          state.selectedLocation = {
            level1: "",
            level2: "",
            level3: "",
            level4: "",
            kato: ""
          };
          state.account = "";
          state.selectedService = null;
        }
        if (item.page === "send") {
          state.selectedLocation = {
            level1: "",
            level2: "",
            level3: "",
            level4: "",
            kato: ""
          };
        }
        setPage(item.page);
      });
      menuEl.appendChild(btn);
    });
  }

  function renderLangSwitches() {
    const buttons = document.querySelectorAll(".lang-switch");
    buttons.forEach(btn => {
      const lang = btn.getAttribute("data-lang");
      if (lang === state.lang) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
      btn.onclick = () => setLang(lang);
    });
  }

  function render() {
    const app = document.getElementById("app");
    if (!app) return;

    renderMenu();
    renderLangSwitches();

    let html = "";

    if (state.currentPage === "home") {
      html += renderHomePage();
    } else if (state.currentPage === "send") {
      html += renderSendPage();
    } else if (state.currentPage === "input_account") {
      html += renderInputAccountPage();
    } else if (state.currentPage === "ul_identify") {
      html += renderULIdentifyPage();
    } else if (state.currentPage === "choose_service") {
      html += renderChooseServicePage();
    } else if (state.currentPage === "input_readings") {
      html += renderInputReadingsPage();
    } else if (state.currentPage === "about") {
      html += renderSimpleTextPage(t("menu.about"));
    } else if (state.currentPage === "contacts") {
      html += renderSimpleTextPage(t("menu.contacts"));
    } else if (state.currentPage === "faq") {
      html += renderSimpleTextPage(t("menu.faq"));
    } else if (state.currentPage === "supplier_key") {
      html += renderSupplierKeyPage();
    } else if (state.currentPage === "supplier_report") {
      html += renderSupplierReportPage();
    }

    app.innerHTML = html;
    attachHandlers();
  }

  function renderHomePage() {
    const tHome = texts[state.lang].home;
    return `
      <section class="card">
        <h1 class="card-title">${tHome.title}</h1>
        <p class="card-subtitle">${tHome.subtitle}</p>
        <div class="home-buttons">
          <button class="home-button" data-client-type="FL">${tHome.fl}</button>
          <button class="home-button" data-client-type="UL">${tHome.ul}</button>
          <button class="home-button" data-client-type="SUPPLIER">${tHome.supplier}</button>
        </div>
      </section>
    `;
  }

  function renderSendPage() {
    const s = texts[state.lang].send;
    const opt1 = getKatoOptions(1, {});
    const opt2 = getKatoOptions(2, { level1: state.selectedLocation.level1 });
    const opt3 = getKatoOptions(3, {
      level1: state.selectedLocation.level1,
      level2: state.selectedLocation.level2
    });
    const opt4 = getKatoOptions(4, {
      level1: state.selectedLocation.level1,
      level2: state.selectedLocation.level2,
      level3: state.selectedLocation.level3
    });

    const disabled =
      !state.selectedLocation.level1 ||
      !state.selectedLocation.level2 ||
      !state.selectedLocation.level3 ||
      !state.selectedLocation.level4;

    return `
      <section class="card">
        <div class="form-field">
          <label class="form-label">${s.step1}</label>
          <select class="form-select" id="select-lvl1">
            <option value=""></option>
            ${opt1
              .map(
                o =>
                  `<option value="${o.id}" ${
                    state.selectedLocation.level1 === o.id ? "selected" : ""
                  }>${state.lang === "ru" ? o.nameRu : o.nameKz}</option>`
              )
              .join("")}
          </select>
        </div>
        <div class="form-field">
          <label class="form-label">${s.step2}</label>
          <select class="form-select" id="select-lvl2">
            <option value=""></option>
            ${opt2
              .map(
                o =>
                  `<option value="${o.id}" ${
                    state.selectedLocation.level2 === o.id ? "selected" : ""
                  }>${state.lang === "ru" ? o.nameRu : o.nameKz}</option>`
              )
              .join("")}
          </select>
        </div>
        <div class="form-field">
          <label class="form-label">${s.step3}</label>
          <select class="form-select" id="select-lvl3">
            <option value=""></option>
            ${opt3
              .map(
                o =>
                  `<option value="${o.id}" ${
                    state.selectedLocation.level3 === o.id ? "selected" : ""
                  }>${state.lang === "ru" ? o.nameRu : o.nameKz}</option>`
              )
              .join("")}
          </select>
        </div>
        <div class="form-field">
          <label class="form-label">${s.step4}</label>
          <select class="form-select" id="select-lvl4">
            <option value=""></option>
            ${opt4
              .map(
                o =>
                  `<option value="${o.id}" data-kato="${o.kato}" ${
                    state.selectedLocation.level4 === o.id ? "selected" : ""
                  }>${state.lang === "ru" ? o.nameRu : o.nameKz}</option>`
              )
              .join("")}
          </select>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" id="btn-send-continue" ${
            disabled ? "disabled" : ""
          }>${s.continue}</button>
        </div>
      </section>
    `;
  }

  function renderInputAccountPage() {
    const block = texts[state.lang].inputAccount;
    return `
      <section class="card">
        <h2 class="card-title">${block.title}</h2>
        <div class="form-field">
          <input
            id="input-account"
            class="form-input"
            type="text"
            maxlength="20"
          />
          <div class="form-warning">${block.warning}</div>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" id="btn-account-check">${block.buttonCheck}</button>
          <button class="btn btn-secondary" id="btn-back-send">${texts[state.lang].generic.back}</button>
        </div>
        ${renderMessages()}
      </section>
    `;
  }

  function renderULIdentifyPage() {
    const u = texts[state.lang].ul;
    return `
      <section class="card">
        <h2 class="card-title">${u.identifyTitle}</h2>

        <div class="form-field">
          <label class="form-label">${u.accountLabel}</label>
          <input id="ul-account" class="form-input" type="text" maxlength="20" />
        </div>

        <div class="form-field">
          <label class="form-label">${u.contractNumberLabel}</label>
          <input id="ul-contract-number" class="form-input" type="text" />
        </div>

        <div class="form-field">
          <label class="form-label">${u.contractDateLabel}</label>
          <input id="ul-contract-date" class="form-input" type="date" />
        </div>

        <div class="form-actions">
          <button class="btn btn-primary" id="btn-ul-next">${u.nextButton}</button>
          <button class="btn btn-secondary" id="btn-back-send">${texts[state.lang].generic.back}</button>
        </div>

        ${renderMessages()}
      </section>
    `;
  }

  function renderChooseServicePage() {
    const cs = texts[state.lang].chooseService;
    return `
      <section class="card">
        <h2 class="card-title">${cs.title}</h2>
        <div class="home-buttons">
          <button class="home-button" data-service="EE">${cs.ee}</button>
          <button class="home-button" data-service="HW">${cs.hw}</button>
          <button class="home-button" data-service="CW">${cs.cw}</button>
          <button class="home-button" data-service="GAS">${cs.gas}</button>
        </div>
        <div class="form-actions" style="margin-top:16px;">
          <button class="btn btn-secondary" id="btn-back-account">${texts[state.lang].generic.back}</button>
        </div>
        ${renderMessages()}
      </section>
    `;
  }

  function renderInputReadingsPage() {
    const ir = texts[state.lang].inputReadings;
    const loc = state.selectedLocation;
    const serviceLabel = getServiceLabel(state.selectedService);
    const prev = state.previousReading;

    const locationText = [
      loc.level1,
      loc.level2,
      loc.level3,
      loc.level4
    ]
      .filter(Boolean)
      .join(" / ");

    if (state.clientType === "UL") {
      const u = texts[state.lang].ul;
      const hint = u.addCounterHint.replace(
        "{serviceGenitive}",
        getServiceGenitive(state.selectedService)
      );

      const blocks = state.ulCounters
        .map(
          c => `
          <div class="counter-block" data-counter-id="${c.id}">
            <div class="counter-title">#${c.id}</div>
            <div class="form-field">
              <label class="form-label">${ir.valueLabel}</label>
              <input class="form-input ul-counter-value" type="text" value="${c.value || ""}" />
            </div>
            <div class="form-field">
              <label class="form-label">${ir.fileLabel}</label>
              <input class="form-input ul-counter-file" type="file" accept="image/*" />
              ${
                c.fileName
                  ? `<div class="form-hint">${c.fileName}</div>`
                  : ""
              }
            </div>
          </div>
        `
        )
        .join("");

      return `
        <section class="card">
          <h2 class="card-title">${ir.title}</h2>
          <p class="card-subtitle">
            ${locationText ? locationText + " — " : ""}${serviceLabel}
          </p>

          ${blocks}

          <button class="btn btn-link" id="btn-add-counter">${u.addCounterLink}</button>
          <div class="form-hint" style="margin-top:4px;">${hint}</div>

          <div class="form-actions" style="margin-top:16px;">
            <button class="btn btn-primary" id="btn-send-ul">${ir.sendButton}</button>
            <button class="btn btn-secondary" id="btn-back-service">${texts[state.lang].generic.back}</button>
          </div>

          ${renderMessages(true)}
        </section>
      `;
    }

    const decreasedControls = state.decreasedWarning
      ? `
      <div class="form-actions" style="margin-top:12px;">
        <button class="btn btn-primary" id="btn-force-send">${texts[state.lang].ocr.confirmAndSend}</button>
        <button class="btn btn-secondary" id="btn-change-data">${texts[state.lang].ocr.changeData}</button>
      </div>
    `
      : "";

    return `
      <section class="card">
        <h2 class="card-title">${ir.title}</h2>
        <p class="card-subtitle">
          ${locationText ? locationText + " — " : ""}${serviceLabel}
        </p>
        ${
          prev
            ? `<div class="previous-readings">${ir.previousPrefix} ${prev.value} ${ir.previousDate} ${prev.date}.</div>`
            : ""
        }
        <div class="form-field">
          <label class="form-label">${ir.valueLabel}</label>
          <input id="readings-value" class="form-input" type="text" value="${state.readingsValue || ""}" />
        </div>
        <div class="form-field">
          <label class="form-label">${ir.fileLabel}</label>
          <input id="readings-file" class="form-input" type="file" accept="image/*" />
          ${
            state.readingsFileName
              ? `<div class="form-hint">${state.readingsFileName}</div>`
              : ""
          }
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" id="btn-send-fl">${ir.sendButton}</button>
          <button class="btn btn-secondary" id="btn-back-service">${texts[state.lang].generic.back}</button>
          <button class="btn btn-secondary" id="btn-go-home">${ir.goHome}</button>
        </div>
        ${renderMessages(true)}
        ${decreasedControls}
      </section>
    `;
  }

  function renderSupplierKeyPage() {
    const s = texts[state.lang].supplier;
    return `
      <section class="card">
        <h2 class="card-title">${s.keyTitle}</h2>
        <div class="form-field">
          <input
            id="supplier-key"
            class="form-input"
            type="text"
            value="${state.supplier.accessKey || ""}"
            placeholder="${s.keyPlaceholder}"
          />
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" id="btn-supplier-login">${s.keyButton}</button>
          <button class="btn btn-secondary" id="btn-back-home">${texts[state.lang].generic.back}</button>
        </div>
        ${renderMessages()}
      </section>
    `;
  }

  function renderSupplierReportPage() {
    const s = texts[state.lang].supplier;
    const sup = state.supplier;
    const katoOptions = (sup.katoList || [])
      .map(
        k =>
          `<option value="${k}" ${
            sup.selectedKato === k ? "selected" : ""
          }>${k}</option>`
      )
      .join("");
    return `
      <section class="card">
        <h2 class="card-title">${s.reportTitle}</h2>

        <div class="form-field">
          <label class="form-label">${s.katoLabel}</label>
          <select id="supplier-kato" class="form-select">
            ${katoOptions}
          </select>
        </div>

        <div class="form-field">
          <label class="form-label">${s.fromLabel}</label>
          <input id="supplier-from" class="form-input" type="date" value="${sup.from || ""}" />
        </div>

        <div class="form-field">
          <label class="form-label">${s.toLabel}</label>
          <input id="supplier-to" class="form-input" type="date" value="${sup.to || ""}" />
        </div>

        <div class="form-field">
          <label class="form-label">${s.formatLabel}</label>
          <select id="supplier-format" class="form-select">
            <option value="csv" ${
              sup.format === "csv" ? "selected" : ""
            }>${s.formatCsv}</option>
            <option value="xlsx" ${
              sup.format === "xlsx" ? "selected" : ""
            }>${s.formatXlsx}</option>
          </select>
        </div>

        <div class="form-actions">
          <button class="btn btn-primary" id="btn-supplier-report">${s.reportButton}</button>
          <button class="btn btn-secondary" id="btn-back-home">${texts[state.lang].generic.back}</button>
        </div>

        ${renderMessages()}
      </section>
    `;
  }

  function renderSimpleTextPage(title) {
    return `
      <section class="card">
        <h2 class="card-title">${title}</h2>
        ${renderMessages()}
      </section>
    `;
  }

  function renderMessages(includeSuccess) {
    let html = "";
    if (state.loading) {
      html += `<div class="notice notice-info">${texts[state.lang].generic.loading}</div>`;
    }
    if (state.lastErrorMessage) {
      html += `<div class="notice notice-error">${state.lastErrorMessage}</div>`;
    }
    if (state.lastInfoMessage) {
      html += `<div class="notice notice-info">${state.lastInfoMessage}</div>`;
    }
    if (includeSuccess && state.lastSuccessMessage) {
      html += `<div class="notice notice-success">${state.lastSuccessMessage}</div>`;
    }
    return html;
  }

  function attachHandlers() {
    // home buttons
    document
      .querySelectorAll(".home-button[data-client-type]")
      .forEach(btn => {
        btn.addEventListener("click", () => {
          const type = btn.getAttribute("data-client-type");
          state.clientType = type;

          if (type === "SUPPLIER") {
            // сначала выбор КАТО, потом ключ
            setPage("send");
          } else {
            setPage("send");
          }
        });
      });

    // send page
    const lvl1 = document.getElementById("select-lvl1");
    const lvl2 = document.getElementById("select-lvl2");
    const lvl3 = document.getElementById("select-lvl3");
    const lvl4 = document.getElementById("select-lvl4");
    if (lvl1) {
      lvl1.onchange = e => {
        state.selectedLocation.level1 = e.target.value;
        state.selectedLocation.level2 = "";
        state.selectedLocation.level3 = "";
        state.selectedLocation.level4 = "";
        state.selectedLocation.kato = "";
        render();
      };
    }
    if (lvl2) {
      lvl2.onchange = e => {
        state.selectedLocation.level2 = e.target.value;
        state.selectedLocation.level3 = "";
        state.selectedLocation.level4 = "";
        state.selectedLocation.kato = "";
        render();
      };
    }
    if (lvl3) {
      lvl3.onchange = e => {
        state.selectedLocation.level3 = e.target.value;
        state.selectedLocation.level4 = "";
        state.selectedLocation.kato = "";
        render();
      };
    }
    if (lvl4) {
      lvl4.onchange = e => {
        const opt =
          e.target.options[e.target.selectedIndex] || null;
        state.selectedLocation.level4 = e.target.value;
        state.selectedLocation.kato =
          opt?.getAttribute("data-kato") || "";
        render();
      };
    }
    const btnSendCont = document.getElementById(
      "btn-send-continue"
    );
    if (btnSendCont) {
      btnSendCont.onclick = () => {
        if (!state.selectedLocation.kato) return;
        if (state.clientType === "FL") {
          state.account = "";
          setPage("input_account");
        } else if (state.clientType === "UL") {
          state.ul = { account: "", contractNumber: "", contractDate: "" };
          setPage("ul_identify");
        } else if (state.clientType === "SUPPLIER") {
          setPage("supplier_key");
        } else {
          setPage("input_account");
        }
      };
    }

    // input account
    const inputAcc = document.getElementById("input-account");
    if (inputAcc) {
      inputAcc.value = state.account || "";
      inputAcc.oninput = e => {
        state.account = e.target.value.replace(/[^\d]/g, "");
      };
    }
    const btnAccCheck = document.getElementById(
      "btn-account-check"
    );
    if (btnAccCheck) {
      btnAccCheck.onclick = () => {
        handleCheckAccountFL();
      };
    }
    const btnBackSend = document.getElementById("btn-back-send");
    if (btnBackSend) {
      btnBackSend.onclick = () => setPage("send");
    }

    // UL identify
    const ulAcc = document.getElementById("ul-account");
    if (ulAcc) {
      ulAcc.value = state.ul.account || "";
      ulAcc.oninput = e => {
        state.ul.account = e.target.value.replace(/[^\d]/g, "");
      };
    }
    const ulNum = document.getElementById(
      "ul-contract-number"
    );
    if (ulNum) {
      ulNum.value = state.ul.contractNumber || "";
      ulNum.oninput = e => {
        state.ul.contractNumber = e.target.value;
      };
    }
    const ulDate = document.getElementById("ul-contract-date");
    if (ulDate) {
      ulDate.value = state.ul.contractDate || "";
      ulDate.oninput = e => {
        state.ul.contractDate = e.target.value;
      };
    }
    const btnUlNext = document.getElementById("btn-ul-next");
    if (btnUlNext) {
      btnUlNext.onclick = () => {
        handleCheckUL();
      };
    }

    // choose service
    document
      .querySelectorAll(".home-button[data-service]")
      .forEach(btn => {
        btn.onclick = () => {
          state.selectedService = btn.getAttribute(
            "data-service"
          );
          state.readingsValue = "";
          state.readingsFile = null;
          state.readingsFileName = "";
          if (state.clientType === "UL") {
            state.ulCounters = [
              { id: 1, value: "", file: null, fileName: "" }
            ];
          }
          setPage("input_readings");
          if (state.clientType === "FL") {
            fetchLastReadings();
          }
        };
      });

    const btnBackAccount =
      document.getElementById("btn-back-account");
    if (btnBackAccount) {
      if (state.clientType === "UL") {
        btnBackAccount.onclick = () => setPage("ul_identify");
      } else {
        btnBackAccount.onclick = () => setPage("input_account");
      }
    }

    // input readings FL
    const rv = document.getElementById("readings-value");
    if (rv) {
      rv.oninput = e => {
        state.readingsValue = e.target.value.replace(
          /[^0-9.,]/g,
          ""
        );
      };
    }
    const rf = document.getElementById("readings-file");
    if (rf) {
      rf.onchange = e => {
        const file = e.target.files[0];
        state.readingsFile = file || null;
        state.readingsFileName = file ? file.name : "";
        render();
      };
    }
    const btnSendFl =
      document.getElementById("btn-send-fl");
    if (btnSendFl) {
      btnSendFl.onclick = () => handleSendReadingsFL();
    }
    const btnChangeData = document.getElementById(
      "btn-change-data"
    );
    if (btnChangeData) {
      btnChangeData.onclick = () => {
        state.decreasedWarning = false;
        state.lastErrorMessage = null;
        render();
      };
    }
    const btnForceSend = document.getElementById(
      "btn-force-send"
    );
    if (btnForceSend) {
      btnForceSend.onclick = () => handleForceSendReadingsFL();
    }
    const btnBackService =
      document.getElementById("btn-back-service");
    if (btnBackService) {
      btnBackService.onclick = () => {
        state.lastSuccessMessage = null;
        setPage("choose_service");
      };
    }
    const btnGoHome = document.getElementById("btn-go-home");
    if (btnGoHome) {
      btnGoHome.onclick = () => {
        state.clientType = null;
        state.account = "";
        state.selectedService = null;
        state.selectedLocation = {
          level1: "",
          level2: "",
          level3: "",
          level4: "",
          kato: ""
        };
        setPage("home");
      };
    }

    // UL counters
    const btnAddCounter =
      document.getElementById("btn-add-counter");
    if (btnAddCounter) {
      btnAddCounter.onclick = () => {
        const maxId = state.ulCounters.reduce(
          (m, c) => Math.max(m, c.id),
          0
        );
        state.ulCounters.push({
          id: maxId + 1,
          value: "",
          file: null,
          fileName: ""
        });
        render();
      };
    }
    const counterBlocks = document.querySelectorAll(
      ".counter-block"
    );
    counterBlocks.forEach(block => {
      const id = parseInt(
        block.getAttribute("data-counter-id"),
        10
      );
      const counter = state.ulCounters.find(c => c.id === id);
      if (!counter) return;
      const valInput = block.querySelector(
        ".ul-counter-value"
      );
      const fileInput = block.querySelector(
        ".ul-counter-file"
      );
      if (valInput) {
        valInput.value = counter.value || "";
        valInput.oninput = e => {
          counter.value = e.target.value.replace(
            /[^0-9.,]/g,
            ""
          );
        };
      }
      if (fileInput) {
        fileInput.onchange = e => {
          const file = e.target.files[0];
          counter.file = file || null;
          counter.fileName = file ? file.name : "";
          render();
        };
      }
    });

    const btnSendUl = document.getElementById("btn-send-ul");
    if (btnSendUl) {
      btnSendUl.onclick = () => handleSendReadingsUL();
    }

    // supplier
    const supKey = document.getElementById("supplier-key");
    if (supKey) {
      supKey.oninput = e => {
        state.supplier.accessKey = e.target.value;
      };
    }
    const btnSupLogin = document.getElementById(
      "btn-supplier-login"
    );
    if (btnSupLogin) {
      btnSupLogin.onclick = () => handleSupplierLogin();
    }
    const supKato = document.getElementById("supplier-kato");
    if (supKato) {
      supKato.onchange = e => {
        state.supplier.selectedKato = e.target.value;
      };
    }
    const supFrom = document.getElementById("supplier-from");
    if (supFrom) {
      supFrom.onchange = e => {
        state.supplier.from = e.target.value;
      };
    }
    const supTo = document.getElementById("supplier-to");
    if (supTo) {
      supTo.onchange = e => {
        state.supplier.to = e.target.value;
      };
    }
    const supFormat = document.getElementById(
      "supplier-format"
    );
    if (supFormat) {
      supFormat.onchange = e => {
        state.supplier.format = e.target.value;
      };
    }
    const btnSupReport = document.getElementById(
      "btn-supplier-report"
    );
    if (btnSupReport) {
      btnSupReport.onclick = () => handleSupplierReport();
    }

    const btnBackHome1 = document.getElementById(
      "btn-back-home"
    );
    if (btnBackHome1) {
      btnBackHome1.onclick = () => {
        state.clientType = null;
        setPage("home");
      };
    }
  }

  document.addEventListener("DOMContentLoaded", render);
})();
