// -----------------------------------------------------------
// 1. Константы и Глобальное состояние (AppState)
// -----------------------------------------------------------


// В реальном проекте Worker должен быть развернут и доступен по этому URL
const API_URL = '/api/'; 

const AppState = {
    // Состояние локализации
    CURRENT_LANG: localStorage.getItem('appLang') || 'ru', 
    CURRENT_PAGE: 'home', 

    // Состояние пользователя
    CLIENT_TYPE: null, // FL, UL, SUPPLIER
    ACCOUNT_OR_CONTRACT: null, 
    CONTRACT_DATE: null, 
    IS_SUPPLIER_AUTHORIZED: false,
    SUPPLIER_AVAILABLE_KATO: [], // КАТО, доступные поставщику

    // Состояние местоположения и услуги
    SELECTED_LOCATION: {
        kato: '', 
        level1: '', 
        level2: '', 
        level3: '', 
        level4: ''
    },
    SELECTED_SERVICE: null, 

    // Состояние ввода показаний
    LAST_READINGS: { value: null, date: null },
    CURRENT_READING_VALUE: null,
    OCR_ATTEMPTS: 0,
    READING_VERIFICATION_STATUS: 'PENDING' // PENDING, VALUE_DECREASED, ATTEMPTS_EXCEEDED
};

// -----------------------------------------------------------
// 2. Утилиты
// -----------------------------------------------------------

/**
 * Получает локализованный текст.
 * @param {string} key - Ключ из ABONENT_TEXTS.
 * @param {Object} [vars={}] - Переменные для подстановки ({value}, {date}).
 * @returns {string} Локализованный текст.
 */
function T(key, vars = {}) {
    const textObject = ABONENT_TEXTS[key];
    if (!textObject) {
        console.error(`Missing text key: ${key}`);
        return `[MISSING TEXT: ${key}]`;
    }
    let text = textObject[AppState.CURRENT_LANG] || textObject['ru'];
    
    // Подстановка переменных
    for (const [varKey, varValue] of Object.entries(vars)) {
        text = text.replace(new RegExp(`{${varKey}}`, 'g'), varValue);
    }
    return text;
}

/**
 * Переключает текущий язык.
 * @param {string} lang - 'ru' или 'kz'.
 */
function switchLanguage(lang) {
    if (AppState.CURRENT_LANG !== lang) {
        AppState.CURRENT_LANG = lang;
        localStorage.setItem('appLang', lang);
        document.documentElement.lang = lang;
        renderHeader();
        renderPage(AppState.CURRENT_PAGE);
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
    }
}

/**
 * Переключает страницу SPA.
 * @param {string} page - Имя страницы.
 */
function navigate(page) {
    AppState.CURRENT_PAGE = page;
    renderPage(page);
    window.scrollTo(0, 0); 
}

// -----------------------------------------------------------
// 3. Рендеринг Шапки
// -----------------------------------------------------------

function renderHeader() {
    const menuContainer = document.getElementById('nav-menu');
    const langKZ = document.getElementById('lang-kz');
    const langRU = document.getElementById('lang-ru');

    document.getElementById('app-title').textContent = T('TITLE');

    // Обновление переключателей языка
    if (langKZ) langKZ.textContent = T('LANG_KZ');
    if (langRU) langRU.textContent = T('LANG_RU');

    // Очистка и заполнение меню
    menuContainer.innerHTML = `
        <a href="#" onclick="navigate('home')">${T('MENU_HOME')}</a>
        <a href="#" onclick="navigate('send')">${T('MENU_SEND')}</a>
        <a href="#" onclick="navigate('about')">${T('MENU_ABOUT')}</a>
        <a href="#" onclick="navigate('contacts')">${T('MENU_CONTACTS')}</a>
        <a href="#" onclick="navigate('faq')">${T('MENU_FAQ')}</a>
    `;
}

// -----------------------------------------------------------
// 4. Моки для КАТО (Каталог Административно-Территориальных Объектов)
// -----------------------------------------------------------

const KATO_MOCK_DATA = [
    { code: '010000000', name_ru: 'г. Астана', name_kz: 'Астана қ.' },
    { code: '110000000', name_ru: 'Алматинская область', name_kz: 'Алматы облысы' },
    { code: '111000000', name_ru: 'Илийский район', name_kz: 'Іле ауданы', parent_code: '110000000' },
    { code: '111030000', name_ru: 'Первомайский с.о.', name_kz: 'Первомай ауылдық округі', parent_code: '111000000' },
    { code: '111031000', name_ru: 'п. Первомайский', name_kz: 'Первомай кенті', parent_code: '111030000' },
    { code: '011000000', name_ru: 'район Есиль', name_kz: 'Есіл ауданы', parent_code: '010000000' }
];

function getKatoOptions(level, parentCode) {
    if (level === 1) {
        // Уровень 1: Области/города республиканского значения (код X00000000)
        return KATO_MOCK_DATA
            .filter(k => k.code.match(/^\d{2}0000000$/))
            .map(item => ({ code: item.code, name: item[`name_${AppState.CURRENT_LANG}`] }));
    }
    if (parentCode) {
        // Фильтрация по parent_code
        return KATO_MOCK_DATA
            .filter(k => k.parent_code === parentCode)
            .map(item => ({ code: item.code, name: item[`name_${AppState.CURRENT_LANG}`] }));
    }
    return [];
}

// -----------------------------------------------------------
// 5. Рендеринг страниц: Общие шаги (Home, Send, Account, Service)
// -----------------------------------------------------------

function renderHomePage() {
    const content = document.getElementById('spa-content');
    content.innerHTML = `
        <h1>${T('HOME_HEADER')}</h1>
        <p>${T('HOME_SERVICE_CHOICE')}</p>
        <div class="service-choice-grid">
            <button class="btn service-btn" onclick="selectClientType('FL')">${T('BUTTON_FL')}</button>
            <button class="btn service-btn" onclick="selectClientType('UL')">${T('BUTTON_UL')}</button>
            <button class="btn service-btn" onclick="selectClientType('SUPPLIER')">${T('BUTTON_SUPPLIER')}</button>
        </div>
    `;
}

function selectClientType(type) {
    AppState.CLIENT_TYPE = type;
    navigate('send'); 
}

// KATO logic
function renderSendPage() {
    const content = document.getElementById('spa-content');
    content.innerHTML = `
        <h1>${T('MENU_SEND')}</h1>
        <div id="kato-form">
            <div class="form-group">
                <label for="level1">${T('LOCATION_LEVEL_1')}</label>
                <select id="level1" data-level="1" onchange="handleKatoChange(1, this.value)"></select>
            </div>
            <div class="form-group">
                <label for="level2">${T('LOCATION_LEVEL_2')}</label>
                <select id="level2" data-level="2" onchange="handleKatoChange(2, this.value)" disabled></select>
            </div>
            <div class="form-group">
                <label for="level3">${T('LOCATION_LEVEL_3')}</label>
                <select id="level3" data-level="3" onchange="handleKatoChange(3, this.value)" disabled></select>
            </div>
            <div class="form-group">
                <label for="level4">${T('LOCATION_LEVEL_4')}</label>
                <select id="level4" data-level="4" onchange="handleKatoChange(4, this.value)" disabled></select>
            </div>
            <button id="kato-continue-btn" class="btn" onclick="submitLocation()" disabled>
                ${T('BUTTON_CONTINUE')}
            </button>
        </div>
    `;
    populateKatoSelect(1, '');
}

function populateKatoSelect(level, parentCode) {
    const selectElement = document.getElementById(`level${level}`);
    if (!selectElement) return;

    selectElement.disabled = true;
    selectElement.innerHTML = `<option value="">-- ${T(`LOCATION_LEVEL_${level}`)} --</option>`;

    if (!parentCode && level !== 1) return;

    const options = getKatoOptions(level, parentCode);
    
    options.forEach(option => {
        selectElement.innerHTML += `<option value="${option.code}">${option.name}</option>`;
    });

    if (options.length > 0 || level === 1) {
        selectElement.disabled = false;
    }
}

function handleKatoChange(level, code) {
    for (let i = level + 1; i <= 4; i++) {
        populateKatoSelect(i, '');
        AppState.SELECTED_LOCATION[`level${i}`] = '';
    }

    AppState.SELECTED_LOCATION[`level${level}`] = code;
    AppState.SELECTED_LOCATION.kato = code;

    if (code) {
        populateKatoSelect(level + 1, code);
    }
    
    const btn = document.getElementById('kato-continue-btn');
    // Проверка, является ли выбранный код конечным (нет следующего уровня или это уровень 4)
    const nextOptions = getKatoOptions(level + 1, code);
    btn.disabled = !(code && (level === 4 || nextOptions.length === 0));
}

function submitLocation() {
    AppState.SELECTED_LOCATION.kato = 
        AppState.SELECTED_LOCATION.level4 || 
        AppState.SELECTED_LOCATION.level3 || 
        AppState.SELECTED_LOCATION.level2 || 
        AppState.SELECTED_LOCATION.level1;
        
    if (AppState.CLIENT_TYPE === 'SUPPLIER') {
        navigate('supplier_login');
    } else {
        navigate('input_account');
    }
}

// FL Account Logic
function renderFLAccountInput(errorMessage = null) {
    const content = document.getElementById('spa-content');
    content.innerHTML = `
        <h1>${T('FL_ACCOUNT_HEADER')}</h1>
        <div id="fl-input-form">
            <div class="form-group">
                <input type="text" id="account-input" placeholder="${T('FL_ACCOUNT_HEADER')}" value="${AppState.ACCOUNT_OR_CONTRACT || ''}">
            </div>
            
            ${errorMessage ? `<p class="error-message">${errorMessage}</p>` : ''}

            <button class="btn" onclick="checkAccount()">
                ${T('BUTTON_CHECK')}
            </button>
            
            <p class="notice-period">${T('NOTICE_PERIOD')}</p>
        </div>
    `;
}

async function checkAccount() {
    const account = document.getElementById('account-input').value.trim();
    if (!account) return;

    AppState.ACCOUNT_OR_CONTRACT = account;
    const kato = AppState.SELECTED_LOCATION.kato;
    const clientType = AppState.CLIENT_TYPE;

    try {
        const response = await fetch(API_URL + 'check-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account, kato, clientType })
        });
        
        const data = await response.json();

        if (data.found) {
            navigate('choose_service');
        } else {
            renderFLAccountInput(T('ERROR_ACCOUNT_NOT_FOUND'));
        }
    } catch (e) {
        console.error('Error checking account:', e);
        renderFLAccountInput(T('ERROR_ACCOUNT_NOT_FOUND')); 
    }
}

// UL Contract Logic
function renderULContractInput(errorMessage = null) {
    const content = document.getElementById('spa-content');
    content.innerHTML = `
        <h1>${T('UL_CONTRACT_HEADER')}</h1>
        <div id="ul-input-form">
            <div class="form-group">
                <label for="contract-number">${T('UL_CONTRACT_NUMBER')}</label>
                <input type="text" id="contract-number" value="${AppState.ACCOUNT_OR_CONTRACT || ''}">
            </div>
            <div class="form-group">
                <label for="contract-date">${T('UL_CONTRACT_DATE')}</label>
                <input type="date" id="contract-date" value="${AppState.CONTRACT_DATE || ''}">
            </div>
            
            ${errorMessage ? `<p class="error-message">${errorMessage}</p>` : ''}

            <button class="btn" onclick="checkContract()">
                ${T('BUTTON_CHECK')}
            </button>
            
            <p class="notice-period">${T('NOTICE_PERIOD')}</p>
        </div>
    `;
}

async function checkContract() {
    const contractNumber = document.getElementById('contract-number').value.trim();
    const contractDate = document.getElementById('contract-date').value;

    if (!contractNumber || !contractDate) {
        renderULContractInput(T('ERROR_CONTRACT_NOT_FOUND')); 
        return;
    }

    AppState.ACCOUNT_OR_CONTRACT = contractNumber;
    AppState.CONTRACT_DATE = contractDate;

    const kato = AppState.SELECTED_LOCATION.kato;
    const clientType = AppState.CLIENT_TYPE;

    try {
        const response = await fetch(API_URL + 'check-contract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contractNumber, contractDate, kato, clientType })
        });
        
        const data = await response.json();

        if (data.found) {
            navigate('choose_service');
        } else {
            renderULContractInput(T('ERROR_CONTRACT_NOT_FOUND'));
        }
    } catch (e) {
        console.error('Error checking contract:', e);
        renderULContractInput(T('ERROR_CONTRACT_NOT_FOUND'));
    }
}

// Choose Service Logic
function renderChooseServicePage() {
    const content = document.getElementById('spa-content');
    content.innerHTML = `
        <h1>${T('HOME_SERVICE_CHOICE')}</h1>
        <div class="service-choice-grid">
            <button class="btn service-btn" onclick="selectService('EE')">${T('SERVICE_EE')}</button>
            <button class="btn service-btn" onclick="selectService('HW')">${T('SERVICE_HW')}</button>
            <button class="btn service-btn" onclick="selectService('CW')">${T('SERVICE_CW')}</button>
            <button class="btn service-btn" onclick="selectService('GAS')">${T('SERVICE_GAS')}</button>
        </div>
    `;
}

function selectService(serviceCode) {
    AppState.SELECTED_SERVICE = serviceCode;
    AppState.OCR_ATTEMPTS = 0; // Сброс попыток при выборе новой услуги
    AppState.READING_VERIFICATION_STATUS = 'PENDING';
    navigate('input_readings'); 
}

// -----------------------------------------------------------
// 6. Рендеринг страниц: Ввод показаний (input_readings)
// -----------------------------------------------------------

async function renderInputReadingsPage(errorMessage = null) {
    const content = document.getElementById('spa-content');
    
    // 1. Получение предыдущих показаний (если еще не получены)
    if (AppState.LAST_READINGS.value === null) {
        await fetchPreviousReadings();
    }

    const previousHTML = AppState.LAST_READINGS.value !== null
        ? `<div class="previous-readings">${T('READINGS_PREVIOUS', AppState.LAST_READINGS)}</div>`
        : '';
        
    const serviceName = T(`SERVICE_${AppState.SELECTED_SERVICE}`);

    content.innerHTML = `
        <h1>${serviceName}</h1>
        ${previousHTML}
        
        <form id="readings-form" onsubmit="event.preventDefault(); handleReadingsSubmission()">
            <h2>${T('READINGS_INPUT_PLACEHOLDER_FL')}</h2>
            
            <div class="form-group">
                <label for="reading-value">${T('READINGS_INPUT_PLACEHOLDER_FL')}</label>
                <input type="number" step="0.01" id="reading-value" required 
                       placeholder="00.00" value="${AppState.CURRENT_READING_VALUE || ''}">
            </div>
            
            <div class="form-group">
                <label for="reading-photo">
                    ${T('BUTTON_UPLOAD_PHOTO') || 'Загрузить фото счетчика'}
                </label>
                <input type="file" id="reading-photo" accept="image/*" required>
            </div>
            
            ${errorMessage ? `<p class="error-message">${errorMessage}</p>` : ''}

            <button type="submit" class="btn" id="send-btn">
                ${T('BUTTON_SEND')}
            </button>
            
            <p class="notice-period">${T('NOTICE_PERIOD')}</p>
        </form>
    `;
    
    // Если статус требует подтверждения (показания уменьшились), показываем кнопки подтверждения/изменения
    if (AppState.READING_VERIFICATION_STATUS === 'VALUE_DECREASED') {
        const form = document.getElementById('readings-form');
        form.innerHTML = `
            ${errorMessage ? `<p class="error-message">${errorMessage}</p>` : ''}
            
            <div class="form-group">
                <button class="btn" style="background-color: ${ABONENT_TEXTS.UL_ADD_COUNTER_LINK.ru ? '#28a745' : '#28a745'}; margin-right: 15px;" onclick="handleReadingsSubmission(true)">
                    ${T('BUTTON_CONFIRM_AND_SEND')}
                </button>
                <button class="btn" onclick="AppState.READING_VERIFICATION_STATUS='PENDING'; renderInputReadingsPage()">
                    ${T('BUTTON_EDIT_DATA')}
                </button>
            </div>
        `;
    }
}

/**
 * Запрашивает предыдущие показания из Worker.
 */
async function fetchPreviousReadings() {
    const account = AppState.ACCOUNT_OR_CONTRACT;
    const service = AppState.SELECTED_SERVICE;
    
    try {
        const response = await fetch(`${API_URL}last-readings?account=${account}&service=${service}`);
        const data = await response.json();
        
        if (data.found) {
            AppState.LAST_READINGS = {
                value: data.value,
                date: new Date(data.date).toLocaleDateString(AppState.CURRENT_LANG === 'kz' ? 'kk-KZ' : 'ru-RU')
            };
        }
    } catch (e) {
        console.error('Failed to fetch previous readings:', e);
        // Оставляем LAST_READINGS пустым, продолжаем
    }
}

/**
 * Обрабатывает отправку формы показаний.
 * @param {boolean} [confirmedDecrease=false] - Подтверждено ли уменьшение показаний.
 */
async function handleReadingsSubmission(confirmedDecrease = false) {
    const valueInput = document.getElementById('reading-value');
    const photoInput = document.getElementById('reading-photo');
    const sendBtn = document.getElementById('send-btn');

    if (!valueInput || !photoInput) return;
    
    const value = parseFloat(valueInput.value);

    if (isNaN(value) || value < 0) {
        renderInputReadingsPage(T('ERROR_INVALID_VALUE_FORMAT'));
        return;
    }

    if (!photoInput.files || photoInput.files.length === 0) {
        renderInputReadingsPage(T('ERROR_OCR_UNREADABLE')); // Используем общую ошибку для отсутствия фото
        return;
    }
    
    AppState.CURRENT_READING_VALUE = value;

    // Включение загрузочного состояния
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = '...'; 
    }

    const formData = new FormData();
    formData.append('account', AppState.ACCOUNT_OR_CONTRACT);
    formData.append('kato', AppState.SELECTED_LOCATION.kato);
    formData.append('service', AppState.SELECTED_SERVICE);
    formData.append('valueUser', value);
    formData.append('photo', photoInput.files[0]);
    formData.append('ocrAttempts', AppState.OCR_ATTEMPTS);
    formData.append('confirmedDecrease', confirmedDecrease);
    
    try {
        const response = await fetch(API_URL + 'send-readings', {
            method: 'POST',
            body: formData 
        });

        const data = await response.json();
        
        // 1. Успешная отправка (Final Success)
        if (response.ok && data.status === 'accepted') {
            navigate('success');
            return;
        }

        // 2. Обработка ошибок верификации
        AppState.OCR_ATTEMPTS++;
        let errorMessageKey = '';
        
        switch (data.code) {
            case 'OCR_UNREADABLE':
                errorMessageKey = 'ERROR_OCR_UNREADABLE';
                break;
            case 'OCR_MISMATCH':
                errorMessageKey = 'ERROR_OCR_MISMATCH';
                break;
            case 'VALUE_DECREASED':
                // Переходим в состояние подтверждения
                AppState.READING_VERIFICATION_STATUS = 'VALUE_DECREASED';
                errorMessageKey = 'ERROR_VALUE_DECREASED';
                break;
            default:
                errorMessageKey = 'ERROR_OCR_UNREADABLE'; // Общая ошибка
        }
        
        // Проверка превышения попыток после инкремента
        if (AppState.OCR_ATTEMPTS >= 3) {
            errorMessageKey = 'ERROR_OCR_ATTEMPTS_EXCEEDED';
            AppState.READING_VERIFICATION_STATUS = 'ATTEMPTS_EXCEEDED';
        }

        // Ререндер с ошибкой
        renderInputReadingsPage(T(errorMessageKey));

    } catch (e) {
        console.error('Error sending readings:', e);
        renderInputReadingsPage(T('ERROR_OCR_ATTEMPTS_EXCEEDED'));
    } finally {
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.textContent = T('BUTTON_SEND');
        }
    }
}

// -----------------------------------------------------------
// 7. Рендеринг страницы: Успешная отправка
// -----------------------------------------------------------

function renderSuccessPage() {
    const content = document.getElementById('spa-content');
    
    // Выбор финального сообщения
    let successMessageKey = 'SUCCESS_FINAL_GENERIC'; 
    if (AppState.CLIENT_TYPE === 'FL') {
        successMessageKey = 'SUCCESS_FINAL_FL';
    } else if (AppState.CLIENT_TYPE === 'UL') {
        successMessageKey = 'SUCCESS_FINAL_UL';
    }
    
    content.innerHTML = `
        <div style="text-align: center; padding: 40px; border: 2px solid #28a745; background-color: #e6ffe6; border-radius: 8px;">
            <h1 style="color: #28a745;">✅ ${T(successMessageKey)}</h1>
            <p style="margin-bottom: 30px;">
                ${T('SUCCESS_FINAL_GENERIC')}
            </p>

            <button class="btn" onclick="navigate('choose_service')" style="background-color: #28a745; margin-right: 15px;">
                ${T('SUCCESS_BUTTON_OTHER')}
            </button>
            <button class="btn" onclick="navigate('home')">
                ${T('SUCCESS_BUTTON_HOME')}
            </button>
        </div>
    `;

    // Сброс состояния после успешной отправки
    AppState.CURRENT_READING_VALUE = null;
    AppState.LAST_READINGS = { value: null, date: null };
    AppState.OCR_ATTEMPTS = 0;
    AppState.READING_VERIFICATION_STATUS = 'PENDING';
}

// -----------------------------------------------------------
// 8. Рендеринг страниц: Поставщик (Supplier)
// -----------------------------------------------------------

function renderSupplierLoginPage(errorMessage = null) {
    const content = document.getElementById('spa-content');
    content.innerHTML = `
        <h1>${T('BUTTON_SUPPLIER')}</h1>
        <div id="supplier-login-form">
            <div class="form-group">
                <label for="supplier-key">${T('SUPPLIER_KEY')}</label>
                <input type="text" id="supplier-key" placeholder="${T('SUPPLIER_KEY')}">
            </div>
            
            ${errorMessage ? `<p class="error-message">${errorMessage}</p>` : ''}

            <button class="btn" onclick="checkSupplierKey()">
                ${T('BUTTON_LOGIN')}
            </button>
        </div>
    `;
}

async function checkSupplierKey() {
    const key = document.getElementById('supplier-key').value.trim();
    if (!key) return;

    try {
        const response = await fetch(API_URL + 'check-supplier-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key })
        });
        
        const data = await response.json();

        if (data.found) {
            AppState.IS_SUPPLIER_AUTHORIZED = true;
            AppState.SUPPLIER_AVAILABLE_KATO = data.availableKATO;
            navigate('supplier_report');
        } else {
            renderSupplierLoginPage(T('ERROR_SUPPLIER_KEY'));
        }
    } catch (e) {
        console.error('Error checking supplier key:', e);
        renderSupplierLoginPage(T('ERROR_SUPPLIER_KEY'));
    }
}

function renderSupplierReportPage(errorMessage = null) {
    if (!AppState.IS_SUPPLIER_AUTHORIZED) {
        navigate('supplier_login');
        return;
    }

    const content = document.getElementById('spa-content');
    const today = new Date();
    const defaultDateTo = today.toISOString().substring(0, 7); // YYYY-MM
    
    // Для мока KATO выбираем только те, что доступны поставщику (код KATO=010000000)
    const availableKatoOptions = KATO_MOCK_DATA.filter(k => AppState.SUPPLIER_AVAILABLE_KATO.includes(k.code));
    
    content.innerHTML = `
        <h1>${T('BUTTON_SUPPLIER')}</h1>
        <div id="supplier-report-form">
            <div class="form-group">
                <label for="report-kato">${T('LOCATION_LEVEL_1')}</label>
                <select id="report-kato" required>
                    ${availableKatoOptions.map(k => 
                        `<option value="${k.code}">${k[`name_${AppState.CURRENT_LANG}`]}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label for="date-from">${T('REPORT_PERIOD_FROM')}</label>
                <input type="month" id="date-from" required>
            </div>
            
            <div class="form-group">
                <label for="date-to">${T('REPORT_PERIOD_TO')}</label>
                <input type="month" id="date-to" value="${defaultDateTo}" required>
            </div>
            
            <div class="form-group">
                <label for="report-format">${T('REPORT_FORMAT_LABEL')}</label>
                <select id="report-format" required>
                    <option value="CSV">CSV</option>
                    <option value="XLSX">XLSX (Mock)</option>
                </select>
            </div>
            
            ${errorMessage ? `<p class="error-message">${errorMessage}</p>` : ''}

            <button class="btn" onclick="generateReport()" id="report-btn">
                ${T('BUTTON_GENERATE_REPORT')}
            </button>
        </div>
    `;
}

async function generateReport() {
    const reportBtn = document.getElementById('report-btn');
    const kato = document.getElementById('report-kato').value;
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    const format = document.getElementById('report-format').value;

    if (!kato || !dateFrom || !dateTo || !format) {
        renderSupplierReportPage(T('ERROR_SUPPLIER_KEY')); // Используем эту ошибку как заглушку
        return;
    }
    
    reportBtn.disabled = true;
    reportBtn.textContent = T('BUTTON_LOADING') || 'Загрузка...';

    // Worker будет возвращать файл с нужными заголовками (Content-Disposition: attachment)
    try {
        const response = await fetch(
            `${API_URL}supplier-report?kato=${kato}&dateFrom=${dateFrom}&dateTo=${dateTo}&format=${format}`, 
            { method: 'GET' }
        );
        
        if (response.ok) {
            // Создаем ссылку для скачивания файла
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            // Имя файла берется из заголовка Content-Disposition, если он есть
            const filename = response.headers.get('Content-Disposition')?.split('filename=')[1] || `report.${format.toLowerCase()}`;
            a.download = filename.replace(/"/g, ''); // Удаляем кавычки
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            
            reportBtn.textContent = T('BUTTON_GENERATE_REPORT');
        } else {
            const errorText = await response.text();
            renderSupplierReportPage('Ошибка при получении данных: ' + errorText);
        }
    } catch (e) {
        console.error('Error generating report:', e);
        renderSupplierReportPage('Ошибка соединения с сервером.');
    } finally {
        reportBtn.disabled = false;
        reportBtn.textContent = T('BUTTON_GENERATE_REPORT');
    }
}


// -----------------------------------------------------------
// 9. Главный рендеринг
// -----------------------------------------------------------

function renderPage(page) {
    // Сброс сообщений об ошибках
    document.getElementById('spa-content').querySelectorAll('.error-message').forEach(el => el.remove());
    
    switch(page) {
        case 'home':
            renderHomePage();
            break;
        case 'send':
            renderSendPage();
            break;
        case 'input_account':
            if (AppState.CLIENT_TYPE === 'FL') {
                renderFLAccountInput();
            } else if (AppState.CLIENT_TYPE === 'UL') {
                renderULContractInput();
            }
            break;
        case 'choose_service':
            renderChooseServicePage();
            break;
        case 'input_readings':
             renderInputReadingsPage(); 
            break;
        case 'success':
            renderSuccessPage();
            break;
        case 'supplier_login':
            renderSupplierLoginPage();
            break;
        case 'supplier_report':
            renderSupplierReportPage();
            break;
        // ... (другие страницы: about, contacts, faq - заглушки)
        case 'about':
        case 'contacts':
        case 'faq':
            document.getElementById('spa-content').innerHTML = `<h1>${T(`MENU_${page.toUpperCase()}`)}</h1><p>Раздел в разработке.</p>`;
            break;
        default:
            document.getElementById('spa-content').innerHTML = `<h1>404</h1><p>Страница не найдена (${page})</p>`;
    }
}


// -----------------------------------------------------------
// 10. Инициализация
// -----------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // Установка языка
    document.documentElement.lang = AppState.CURRENT_LANG;
    
    // Инициализация шапки и контента
    renderHeader();
    renderPage(AppState.CURRENT_PAGE);

    // Обработчики переключения языка
    const langKZ = document.getElementById('lang-kz');
    const langRU = document.getElementById('lang-ru');
    if (langKZ) langKZ.addEventListener('click', () => switchLanguage('kz'));
    if (langRU) langRU.addEventListener('click', () => switchLanguage('ru'));
    
    // Обработчик бургер-меню для мобильных
    const burger = document.getElementById('burger-menu');
    if (burger) {
        burger.addEventListener('click', () => {
            document.getElementById('nav-menu').classList.toggle('active');
        });
    }
});

