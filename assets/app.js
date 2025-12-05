/* ---------------------------------------------------
   GLOBAL STATE
--------------------------------------------------- */
let LANG = "kz";
let CURRENT_PAGE = "home";
let CLIENT_TYPE = null; // fl / ul / supplier
let SELECTED_KATO = { l1: null, l2: null, l3: null, l4: null };
let SELECTED_SERVICE = null;

let SUPPLIER_LOGGED_IN = false;
let SUPPLIER_DOWNLOAD_URL = "";

/* ---------------------------------------------------
   DOM UTILS
--------------------------------------------------- */
function $(id) {
  return document.getElementById(id);
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  $(pageId).style.display = "block";
  CURRENT_PAGE = pageId;
}

/* ---------------------------------------------------
   APPLY LANGUAGE TEXTS
--------------------------------------------------- */
function applyTexts() {
  const T = window.TEXTS;

  /* MENU */
  const menu = $("menu");
  menu.innerHTML = T.menu[LANG].map(item => `<a>${item}</a>`).join("");

  /* HOME */
  $("home-title").textContent = T.home.title[LANG];
  $("home-subtitle").textContent = T.home.subtitle[LANG];
  $("btn-home-fl").textContent = T.home.buttons.fl[LANG];
  $("btn-home-ul").textContent = T.home.buttons.ul[LANG];
  $("btn-home-supplier").textContent = T.home.buttons.supplier[LANG];

  /* SEND (KATO) */
  $("send-title-1").textContent = T.kato.level1[LANG];
  $("send-title-2").textContent = T.kato.level2[LANG];
  $("send-title-3").textContent = T.kato.level3[LANG];
  $("send-title-4").textContent = T.kato.level4[LANG];
  $("btn-send-next").textContent = T.kato.next[LANG];

  /* ACCOUNT (FL) */
  $("acc-title").textContent = T.account.title[LANG];
  $("acc-instr").textContent = T.account.instruction[LANG];
  $("acc-submit").textContent = T.account.submit[LANG];
  $("acc-warning").textContent = T.account.warning[LANG];

  /* CONTRACT (UL) */
  $("ctr-title").textContent = T.contract.title[LANG];
  $("ctr-submit").textContent = T.contract.submit[LANG];
  $("ctr-warning").textContent = T.contract.warning[LANG];

  /* CHOOSE SERVICE */
  $("service-title").textContent = T.service.title[LANG];

  document.querySelectorAll("#page-choose-service button").forEach(btn => {
    const service = btn.dataset.service;
    btn.textContent = T.service[service][LANG];
  });

  /* INPUT READINGS */
  $("readings-label").textContent = T.readings.label[LANG];
  $("readings-submit").textContent = T.readings.submit[LANG];

  /* SUPPLIER LOGIN */
  $("spl-login-title").textContent = T.supplier.loginTitle[LANG];
  $("spl-login").textContent = T.supplier.loginBtn[LANG];

  /* SUPPLIER REPORT */
  $("spl-report-title").textContent = T.supplier.reportTitle[LANG];
  $("spl-generate").textContent = T.supplier.generate[LANG];
  $("spl-success").textContent = T.supplier.success[LANG];
  $("spl-download").textContent = T.supplier.download[LANG];
}

/* ---------------------------------------------------
   LANGUAGE SWITCH
--------------------------------------------------- */
document.querySelectorAll("#lang-switch button").forEach(btn => {
  btn.onclick = () => {
    LANG = btn.dataset.lang;
    applyTexts();
  };
});

/* ---------------------------------------------------
   HOME BUTTONS
--------------------------------------------------- */
$("btn-home-fl").onclick = () => {
  CLIENT_TYPE = "fl";
  showPage("page-send");
};

$("btn-home-ul").onclick = () => {
  CLIENT_TYPE = "ul";
  showPage("page-send");
};

$("btn-home-supplier").onclick = () => {
  CLIENT_TYPE = "supplier";
  showPage("page-send");
};

/* ---------------------------------------------------
   KATO LOGIC — заглушка (здесь позже подключим Google Sheets)
--------------------------------------------------- */
async function loadKATO() {
  // Заглушки, пока нет API
  fillSelect($("kato-level-1"), ["Region A", "Region B"]);
  fillSelect($("kato-level-2"), []);
  fillSelect($("kato-level-3"), []);
  fillSelect($("kato-level-4"), []);
}

function fillSelect(el, arr) {
  el.innerHTML = `<option value="">---</option>` +
    arr.map(x => `<option>${x}</option>`).join("");
}

["kato-level-1", "kato-level-2", "kato-level-3", "kato-level-4"].forEach(id => {
  $(id).onchange = () => validateKatoSelection();
});

function validateKatoSelection() {
  const l1 = $("kato-level-1").value;
  const l2 = $("kato-level-2").value;
  const l3 = $("kato-level-3").value;
  const l4 = $("kato-level-4").value;

  SELECTED_KATO = { l1, l2, l3, l4 };

  // Кнопка доступна, если выбран хоть один уровень
  $("btn-send-next").disabled = !l1;
}

$("btn-send-next").onclick = () => {
  if (CLIENT_TYPE === "fl") showPage("page-input-account");
  else if (CLIENT_TYPE === "ul") showPage("page-input-contract");
  else if (CLIENT_TYPE === "supplier") showPage("page-supplier-login");
};

/* ---------------------------------------------------
   FL — CHECK ACCOUNT
--------------------------------------------------- */
$("acc-submit").onclick = async () => {
  const acc = $("acc-input").value.trim();
  if (!/^[0-9]+$/.test(acc)) {
    $("acc-error").textContent = window.TEXTS.account.inputError[LANG];
    return;
  }
  $("acc-error").textContent = "";

  const res = await api("/api/check-account", { account: acc });

  if (!res.ok) {
    $("acc-error").textContent = window.TEXTS.account.notFound[LANG];
    return;
  }

  showPage("page-choose-service");
};

/* ---------------------------------------------------
   UL — CHECK CONTRACT
--------------------------------------------------- */
$("ctr-submit").onclick = async () => {
  const num = $("ctr-number").value.trim();
  const date = $("ctr-date").value.trim();

  if (!num || !date) {
    $("ctr-error").textContent = window.TEXTS.contract.notFound[LANG];
    return;
  }
  $("ctr-error").textContent = "";

  const res = await api("/api/check-contract", {
    contractNumber: num,
    contractDate: date
  });

  if (!res.ok) {
    $("ctr-error").textContent = window.TEXTS.contract.notFound[LANG];
    return;
  }

  showPage("page-choose-service");
};

/* ---------------------------------------------------
   CHOOSE SERVICE
--------------------------------------------------- */
document.querySelectorAll("#page-choose-service button").forEach(btn => {
  btn.onclick = () => {
    SELECTED_SERVICE = btn.dataset.service;
    initReadingsPage();
    showPage("page-input-readings");
  };
});

/* ---------------------------------------------------
   INPUT READINGS
--------------------------------------------------- */
function initReadingsPage() {
  $("previous-readings").textContent = ""; // позже добавим API

  $("readings-input").value = "";
  $("readings-error").textContent = "";
  $("photo-instr").textContent =
    window.TEXTS.readings.photoInstr[LANG].replace("{serviceGen}", SELECTED_SERVICE);

  $("readings-submit").disabled = true;
}

$("readings-input").oninput = validateReadingInputs;
$("photo-input").onchange = validateReadingInputs;

function validateReadingInputs() {
  const val = $("readings-input").value.trim();
  const hasPhoto = $("photo-input").files.length > 0;

  $("readings-submit").disabled = !(val && hasPhoto);
}

$("readings-submit").onclick = async () => {
  const formData = new FormData();
  formData.append("service", SELECTED_SERVICE);
  formData.append("value", $("readings-input").value);
  formData.append("photo", $("photo-input").files[0]);

  const res = await fetch("/api/send-readings", { method: "POST", body: formData });
  const data = await res.json();

  if (data.error) {
    handleOcrError(data.error);
    return;
  }

  alert(window.TEXTS.readings.success[LANG]);
  showPage("page-choose-service");
};

/* ---------------------------------------------------
   OCR ERRORS
--------------------------------------------------- */
function handleOcrError(code) {
  const T = window.TEXTS.ocr;

  let msg = "";
  if (code === "OCR_UNREADABLE") msg = T.unreadable[LANG];
  if (code === "OCR_MISMATCH") msg = T.mismatch[LANG];
  if (code === "OCR_ATTEMPTS_EXCEEDED") msg = T.attemptsExceeded[LANG];
  if (code === "VALUE_DECREASED") msg = T.decreased[LANG];

  $("modal-error-text").textContent = msg;
  $("modal-error").classList.remove("hidden");
}

$("modal-close").onclick = () => {
  $("modal-error").classList.add("hidden");
};

/* ---------------------------------------------------
   SUPPLIER LOGIN
--------------------------------------------------- */
$("spl-login").onclick = async () => {
  const key = $("spl-key").value.trim();
  const res = await api("/api/check-supplier-key", { key });

  if (!res.ok) {
    $("spl-error").textContent = window.TEXTS.modal.supplierAuthError[LANG];
    return;
  }

  SUPPLIER_LOGGED_IN = true;
  showPage("page-supplier-report");
};

/* ---------------------------------------------------
   SUPPLIER REPORT
--------------------------------------------------- */
$("spl-generate").onclick = async () => {
  const from = $("spl-date-from").value;
  const to = $("spl-date-to").value;
  const format = $("spl-format").value;

  const res = await fetch(`/api/supplier-report?from=${from}&to=${to}&format=${format}`);
  if (!res.ok) {
    $("spl-success").textContent = "";
    return;
  }

  const data = await res.json();
  SUPPLIER_DOWNLOAD_URL = data.url;

  $("spl-success").textContent = window.TEXTS.supplier.success[LANG];
  const link = $("spl-download");
  link.href = data.url;
  link.classList.remove("hidden");
};

/* ---------------------------------------------------
   GENERIC API CALL
--------------------------------------------------- */
async function api(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return res;
}

/* ---------------------------------------------------
   INITIALIZE APP
--------------------------------------------------- */
window.onload = () => {
  applyTexts();
  loadKATO();
  showPage("page-home");
};
