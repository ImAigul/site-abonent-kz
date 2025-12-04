/* ----------------------------------------------------------
   SPA ДЛЯ ABONENT.KZ — PART 1
   Все тексты берутся из ABONENT_TEXTS
----------------------------------------------------------- */

let LANGUAGE = localStorage.getItem("lang") || "ru";
let CURRENT_PAGE = "home";
let CLIENT_TYPE = null;
let SELECTED_LOCATION = { code: null };
let ACCOUNT = null;
let CONTRACT = null;
let SERVICE = null;
let UL_METERS = [];

const appEl = document.getElementById("app");
const mobileMenu = document.getElementById("mobile-menu");
const burger = document.getElementById("burger-menu");
const menuDesktop = document.getElementById("main-menu");

function t(key) {
    return ABONENT_TEXTS[LANGUAGE][key];
}

function setLang(lang) {
    LANGUAGE = lang;
    localStorage.setItem("lang", lang);
    render();
}

function api(url, method = "GET", body = null) {
    const opts = { method };
    if (body) {
        opts.headers = { "Content-Type": "application/json" };
        opts.body = body;
    }
    return fetch(url, opts).then(r => r.json());
}

function renderMenu() {
    menuDesktop.innerHTML = `
        <button onclick="go('home')">${t("menu_home")}</button>
        <button onclick="go('send')">${t("menu_send")}</button>
        <button onclick="go('about')">${t("menu_about")}</button>
        <button onclick="go('contacts')">${t("menu_contacts")}</button>
        <button onclick="go('help')">${t("menu_help")}</button>
        <button onclick="setLang('kz')">KAZ</button>
        <button onclick="setLang('ru')">RUS</button>
    `;
}

burger.onclick = () => {
    mobileMenu.classList.toggle("hidden");
    renderMobileMenu();
};

function renderMobileMenu() {
    mobileMenu.innerHTML = `
        <button onclick="go('home')">${t("menu_home")}</button>
        <button onclick="go('send')">${t("menu_send")}</button>
        <button onclick="go('about')">${t("menu_about")}</button>
        <button onclick="go('contacts')">${t("menu_contacts")}</button>
        <button onclick="go('help')">${t("menu_help")}</button>
        <button onclick="setLang('kz')">KAZ</button>
        <button onclick="setLang('ru')">RUS</button>
    `;
}

function go(page) {
    CURRENT_PAGE = page;
    render();
}

function render() {
    renderMenu();

    if (CURRENT_PAGE === "home") return renderHome();
    if (CURRENT_PAGE === "send") return renderKatoLevels();
    if (CURRENT_PAGE === "input_account") {
        if (CLIENT_TYPE === "FL") return renderInputAccountFL();
        if (CLIENT_TYPE === "UL") return renderInputContractUL();
    }
    if (CURRENT_PAGE === "choose_service") return renderChooseService();
    if (CURRENT_PAGE === "input_readings") {
        if (CLIENT_TYPE === "FL") return renderInputReadingsFL();
        if (CLIENT_TYPE === "UL") return renderInputReadingsUL();
    }
    if (CURRENT_PAGE === "supplier_login") return renderSupplierLogin();
    if (CURRENT_PAGE === "supplier_report") return renderSupplierReport();
}

/* ----------------------------------------------------------
   HOME
----------------------------------------------------------- */
function renderHome() {
    appEl.innerHTML = `
        <div class="card">
            <p>${t("home_title")}</p>
            <p>${t("home_choose_service")}</p>

            <button class="btn-primary" onclick="selectType('FL')">${t("home_fl")}</button><br/><br/>
            <button class="btn-primary" onclick="selectType('UL')">${t("home_ul")}</button><br/><br/>
            <button class="btn-primary" onclick="selectType('SUPPLIER')">${t("home_supplier")}</button>
        </div>
    `;
}

function selectType(type) {
    CLIENT_TYPE = type;
    CURRENT_PAGE = "send";
    render();
}

/* ----------------------------------------------------------
   KATO CHAIN
----------------------------------------------------------- */
async function renderKatoLevels() {
    const data = await api("/api/kato");

    appEl.innerHTML = `
        <div class="card">
            <label>${t("choose_region_level1")}</label>
            <select id="k1" onchange="onKatoChange(1)">
                <option value=""></option>
                ${data.level1.map(k => `<option value="${k.code}">${k.name}</option>`).join("")}
            </select>

            <label>${t("choose_region_level2")}</label>
            <select id="k2" onchange="onKatoChange(2)">
                <option value=""></option>
            </select>

            <label>${t("choose_region_level3")}</label>
            <select id="k3" onchange="onKatoChange(3)">
                <option value=""></option>
            </select>

            <label>${t("choose_region_level4")}</label>
            <select id="k4" onchange="onKatoChange(4)">
                <option value=""></option>
            </select>

            <button id="btn-continue" class="btn-primary" disabled onclick="gotoAccountPage()">
                ${t("choose_continue")}
            </button>
        </div>
    `;
}

function onKatoChange(level) {
    const code = document.getElementById("k" + level).value;
    if (!code) return;

    api(`/api/kato?parent=${code}`).then(r => {
        if (level === 1) fillSelect("k2", r);
        if (level === 2) fillSelect("k3", r);
        if (level === 3) fillSelect("k4", r);

        document.getElementById("btn-continue").disabled = true;

        if (r.length === 0) {
            SELECTED_LOCATION.code = code;
            document.getElementById("btn-continue").disabled = false;
        }
    });

    if (level === 4) {
        SELECTED_LOCATION.code = code;
        document.getElementById("btn-continue").disabled = false;
    }
}

function fillSelect(id, arr) {
    document.getElementById(id).innerHTML =
        `<option value=""></option>` +
        arr.map(x => `<option value="${x.code}">${x.name}</option>`).join("");
}

function gotoAccountPage() {
    CURRENT_PAGE = "input_account";
    render();
}

/* ----------------------------------------------------------
   ACCOUNT — FL
----------------------------------------------------------- */
function renderInputAccountFL() {
    appEl.innerHTML = `
        <div class="card">
            <h3>${t("input_account_title_fl")}</h3>

            <input id="acc" type="text" />
            <p class="warning">${t("input_account_warning")}</p>

            <div id="acc-error" class="warning" style="display:none"></div>

            <button class="btn-primary" onclick="checkAccountFL()">${t("input_account_button")}</button>
        </div>
    `;
}

async function checkAccountFL() {
    const acc = document.getElementById("acc").value.trim();
    if (!acc) return;

    const res = await api("/api/check-account", "POST",
        JSON.stringify({
            account: acc,
            kato: SELECTED_LOCATION.code,
            clientType: "FL"
        })
    );

    if (!res.found) {
        const e = document.getElementById("acc-error");
        e.innerHTML = t("input_account_not_found");
        e.style.display = "block";
        return;
    }

    ACCOUNT = acc;
    CURRENT_PAGE = "choose_service";
    render();
}

/* ----------------------------------------------------------
   ACCOUNT — UL
----------------------------------------------------------- */
function renderInputContractUL() {
    appEl.innerHTML = `
        <div class="card">
            <h3>${t("input_account_title_ul")}</h3>

            <input id="contractNumber" type="text" placeholder="${t("input_contract_number")}" />
            <input id="contractDate" type="date" placeholder="${t("input_contract_date")}" />

            <p class="warning">${t("input_account_warning")}</p>

            <div id="contract-error" class="warning" style="display:none"></div>

            <button class="btn-primary" onclick="checkContractUL()">${t("input_contract_button")}</button>
        </div>
    `;
}

async function checkContractUL() {
    const cn = document.getElementById("contractNumber").value.trim();
    const cd = document.getElementById("contractDate").value;

    const res = await api("/api/check-contract", "POST",
        JSON.stringify({
            contractNumber: cn,
            contractDate: cd,
            kato: SELECTED_LOCATION.code,
            clientType: "UL"
        })
    );

    if (!res.found) {
        const e = document.getElementById("contract-error");
        e.innerHTML = t("input_contract_not_found");
        e.style.display = "block";
        return;
    }

    CONTRACT = { cn, cd };
    CURRENT_PAGE = "choose_service";
    render();
}
/* ----------------------------------------------------------
   PART 2 — SERVICE SELECTION + INPUT READINGS FL + UL
----------------------------------------------------------- */

function renderChooseService() {
    appEl.innerHTML = `
        <div class="card">
            <h3>${t("choose_service_title")}</h3>

            <button class="btn-primary" onclick="selectService('EE')">${t("service_ee")}</button><br/><br/>
            <button class="btn-primary" onclick="selectService('HW')">${t("service_hw")}</button><br/><br/>
            <button class="btn-primary" onclick="selectService('CW')">${t("service_cw")}</button><br/><br/>
            <button class="btn-primary" onclick="selectService('GAS')">${t("service_gas")}</button>
        </div>
    `;
}

function selectService(s) {
    SERVICE = s;

    if (CLIENT_TYPE === "FL") {
        CURRENT_PAGE = "input_readings";
        render();
    }

    if (CLIENT_TYPE === "UL") {
        UL_METERS = [{ value: "", file: null }];
        CURRENT_PAGE = "input_readings";
        render();
    }
}

/* ----------------------------------------------------------
   FL — INPUT READINGS
----------------------------------------------------------- */
async function renderInputReadingsFL() {
    const prev = await api(`/api/last-readings?account=${ACCOUNT}&service=${SERVICE}`);

    let prevHTML = "";
    if (prev && prev.value) {
        prevHTML = `<p>${t("previous_readings").replace("{value}", prev.value).replace("{date}", prev.date)}</p>`;
    }

    appEl.innerHTML = `
        <div class="card">
            ${prevHTML}

            <input id="reading" type="text" placeholder="0" />
            <div id="warn" class="warning" style="display:none">${t("readings_warning_input")}</div>

            <input id="photo" type="file" accept="image/*" />

            <button class="btn-primary" onclick="sendReadingsFL()">${t("readings_button_send")}</button>
        </div>
    `;
}

async function sendReadingsFL() {
    const val = document.getElementById("reading").value.trim();
    if (!/^[0-9.,]+$/.test(val)) {
        document.getElementById("warn").style.display = "block";
        return;
    }

    const file = document.getElementById("photo").files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("account", ACCOUNT);
    fd.append("kato", SELECTED_LOCATION.code);
    fd.append("service", SERVICE);
    fd.append("value", val);
    fd.append("photo", file);

    const res = await fetch("/api/send-readings", { method: "POST", body: fd }).then(r => r.json());

    if (res.error === "OCR_UNREADABLE") return showError(t("ocr_unreadable"));
    if (res.error === "OCR_MISMATCH") return showError(t("ocr_mismatch"));
    if (res.error === "OCR_ATTEMPTS_EXCEEDED") return showError(t("ocr_attempts_exceeded"));

    if (res.error === "VALUE_DECREASED") return askValueDecreaseFL(fd);

    if (res.status === "accepted") {
        showSuccess(t("readings_success"));
        CURRENT_PAGE = "choose_service";
        render();
    }
}

function askValueDecreaseFL(originalFD) {
    showConfirm(
        t("readings_decreased"),
        t("readings_confirm"),
        () => forceAcceptFL(originalFD)
    );
}

function forceAcceptFL(fd) {
    fd.append("forceaccept", "true");
    fetch("/api/send-readings", { method: "POST", body: fd })
        .then(r => r.json())
        .then(res => {
            if (res.status === "accepted") {
                showSuccess(t("readings_success"));
                CURRENT_PAGE = "choose_service";
                render();
            }
        });
}

/* ----------------------------------------------------------
   UL — INPUT MULTIPLE METERS
----------------------------------------------------------- */
async function renderInputReadingsUL() {
    let metersHTML = UL_METERS.map((m, i) => `
        <div class="card meter-block">
            <h4>№${i + 1}</h4>
            <input type="text" id="meter-val-${i}" placeholder="0" />
            <input type="file" id="meter-photo-${i}" accept="image/*" />
        </div>
    `).join("");

    appEl.innerHTML = `
        ${metersHTML}

        <div style="margin-bottom:20px;">
            <button class="btn-secondary" onclick="addULMeter()">${t("ul_add_meter")}</button>
            <p style="font-style:italic;">${t("ul_add_meter_hint")}</p>
        </div>

        <button class="btn-primary" onclick="sendReadingsUL()">${t("readings_button_send")}</button>
    `;
}

function addULMeter() {
    UL_METERS.push({ value: "", file: null });
    render();
}

async function sendReadingsUL() {
    for (let i = 0; i < UL_METERS.length; i++) {
        const val = document.getElementById(`meter-val-${i}`).value.trim();
        const file = document.getElementById(`meter-photo-${i}`).files[0];

        if (!/^[0-9.,]+$/.test(val)) {
            showError(t("readings_warning_input"));
            return;
        }
        if (!file) {
            showError(t("photo_required"));
            return;
        }

        const fd = new FormData();
        fd.append("contractNumber", CONTRACT.cn);
        fd.append("contractDate", CONTRACT.cd);
        fd.append("kato", SELECTED_LOCATION.code);
        fd.append("service", SERVICE);
        fd.append("value", val);
        fd.append("photo", file);

        const res = await fetch("/api/send-readings", { method: "POST", body: fd }).then(r => r.json());

        if (res.error === "OCR_UNREADABLE") return showError(t("ocr_unreadable"));
        if (res.error === "OCR_MISMATCH") return showError(t("ocr_mismatch"));
        if (res.error === "OCR_ATTEMPTS_EXCEEDED") return showError(t("ocr_attempts_exceeded"));

        if (res.status !== "accepted") return showError("Ошибка");
    }

    showSuccess(t("ul_success"));
    CURRENT_PAGE = "choose_service";
    render();
}

/* ----------------------------------------------------------
   SUPPLIER LOGIN
----------------------------------------------------------- */
function renderSupplierLogin() {
    appEl.innerHTML = `
        <div class="card">
            <input id="supplier-key" type="text" placeholder="${t("supplier_key")}" />
            <button class="btn-primary" onclick="loginSupplier()">${t("supplier_login")}</button>
        </div>
    `;
}

async function loginSupplier() {
    const key = document.getElementById("supplier-key").value.trim();

    const res = await api("/api/check-supplier-key", "POST",
        JSON.stringify({ key })
    );

    if (!res.ok) return showError(t("supplier_key_invalid"));

    CURRENT_PAGE = "supplier_report";
    render();
}

/* ----------------------------------------------------------
   SUPPLIER REPORT
----------------------------------------------------------- */
function renderSupplierReport() {
    appEl.innerHTML = `
        <div class="card">
            <label>${t("supplier_period_from")}</label>
            <input type="month" id="d1" />

            <label>${t("supplier_period_to")}</label>
            <input type="month" id="d2" />

            <label>${t("supplier_format")}</label>
            <select id="format">
                <option value="csv">CSV</option>
                <option value="xlsx">Excel</option>
            </select>

            <button class="btn-primary" onclick="downloadReport()">${t("supplier_generate")}</button>
        </div>
    `;
}

function downloadReport() {
    const d1 = document.getElementById("d1").value;
    const d2 = document.getElementById("d2").value;
    const fmt = document.getElementById("format").value;

    window.location = `/api/supplier-report?from=${d1}&to=${d2}&format=${fmt}`;
}

/* ----------------------------------------------------------
   PART 3 — COMMON UI HELPERS + FINAL RENDER CALL
----------------------------------------------------------- */

/* ----------------------------------------------------------
   МОДАЛКИ (БЕЗ ИЗМЕНЕНИЯ ТЕКСТОВ!)
   ВСЕ сообщения — только через texts.js
----------------------------------------------------------- */

function showError(msg) {
    const box = document.createElement("div");
    box.className = "modal error-modal";
    box.innerHTML = `
        <div class="modal-content">
            <p>${msg}</p>
            <button class="btn-primary" onclick="this.parentNode.parentNode.remove()">OK</button>
        </div>
    `;
    document.body.appendChild(box);
}

function showSuccess(msg) {
    const box = document.createElement("div");
    box.className = "modal success-modal";
    box.innerHTML = `
        <div class="modal-content">
            <p>${msg}</p>
            <button class="btn-primary" onclick="this.parentNode.parentNode.remove()">OK</button>
        </div>
    `;
    document.body.appendChild(box);
}

function showConfirm(text1, text2, onConfirm) {
    const box = document.createElement("div");
    box.className = "modal confirm-modal";
    box.innerHTML = `
        <div class="modal-content">
            <p>${text1}</p>
            <p>${text2}</p>
            <div class="modal-buttons">
                <button class="btn-primary" id="confirm-yes">${t("confirm_yes")}</button>
                <button class="btn-secondary" id="confirm-no">${t("confirm_no")}</button>
            </div>
        </div>
    `;

    document.body.appendChild(box);

    document.getElementById("confirm-yes").onclick = () => {
        box.remove();
        onConfirm();
    };

    document.getElementById("confirm-no").onclick = () => {
        box.remove();
    };
}

/* ----------------------------------------------------------
   МАКЕТ МОДАЛОК (CSS СОСТАВЛЯЕТСЯ В styles.css)
----------------------------------------------------------- */

function injectModalCSS() {
    const css = `
        .modal {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.45);
            display: flex; justify-content: center; align-items: center;
            z-index: 9999;
        }
        .modal-content {
            background: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 420px;
            width: 90%;
            text-align: center;
        }
        .modal-buttons { 
            display: flex; 
            justify-content: space-around; 
            margin-top: 20px;
        }
    `;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
}

/* ----------------------------------------------------------
   ДОБАВЛЕНИЕ CSS ДЛЯ МОДАЛОК ПРИ СТАРТЕ
----------------------------------------------------------- */
injectModalCSS();

/* ----------------------------------------------------------
   ЗАПУСК ПРИЛОЖЕНИЯ
----------------------------------------------------------- */
render();

