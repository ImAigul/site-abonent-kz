// =======================================================================
// 1. КОНСТАНТЫ И ГЛОБАЛЬНОЕ СОСТОЯНИЕ (STATE)
// =======================================================================

// URL развернутого Cloudflare Worker (замените на свой домен)
const WORKER_API_URL = 'YOUR_CLOUDFLARE_WORKER_URL'; 

// 2.2. Маппер ключей ошибок OCR
const OCR_KEY_MAP = {
    OCR_UNREADABLE: 'unreadable',
    OCR_MISMATCH: 'mismatch',
    OCR_ATTEMPTS_EXCEEDED: 'attempts',
    VALUE_DECREASED: 'decreased'
};

const state = {
    currentLang: 'kz',
    currentPage: 'home',
    KATO: null,
    clientType: null,
    service: null,
    account: null,
    contract: null,
    contractDate: null,
    lastReadings: null,
    // Временное хранилище загруженных уровней KATO для текущего языка
    katoCache: { '1': [] }, 
};

// =======================================================================
// 2. API-КЛИЕНТ (РАБОТА С WORKER)
// =======================================================================

const workerAPI = {
    // В реальном KATO нужно проверить, что код заканчивается на '000', '000000' и т.д.
    KATO_READINESS_MAP: ['100000000', '190000000'], 

    /**
     * Запрос к Cloudflare Worker для получения следующего уровня KATO.
     */
    async getKatoLevels(parentCode = null) {
        const lang = state.currentLang;
        const cacheKey = parentCode || '1';

        // 1. Кэширование
        if (state.katoCache[cacheKey] && state.katoCache[cacheKey].length > 0) {
            return state.katoCache[cacheKey];
        }

        try {
            const url = new URL(WORKER_API_URL);
            url.searchParams.append('action', 'getKatoLevels');
            url.searchParams.append('lang', lang);
            if (parentCode) {
                url.searchParams.append('parentCode', parentCode);
            }

            const response = await fetch(url.toString());
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'error') {
                 console.error('Worker API error:', data.message);
                 return [];
            }
            
            // 2. Сохранение в кэш
            state.katoCache[cacheKey] = data; 
            return data;
            
        } catch (error) {
            console.error("Failed to fetch KATO data from worker:", error);
            return [];
        }
    },
    
    // --- Остальные API-методы (оставлены как моки для сохранения логики) ---
    async checkAccount(data) {
        const isReady = this.KATO_READINESS_MAP.includes(data.kato) || data.kato.endsWith('000'); // Упрощенная проверка
        if (!isReady) {
            return { status: 'skipped' };
        }
        // ... (остальной мок)
        if (data.clientType === 'FL' && data.account === '123456789') {
            return { status: 'success' };
        }
        if (data.clientType === 'UL' && data.contract === '987' && data.contractDate === '2020-01-01') {
            return { status: 'success' };
        }
        return { status: 'error', message: 'Not found' };
    },
    
    async getLastReadings(data) {
        // ... (мок)
        if (state.account === '123456789' && state.service === 'electricity') {
            return { value: 1500, date: '05.11.2025' };
        }
        return null;
    },

    async sendReadings(formData) {
        // ... (мок)
        if (state.clientType === 'FL' && state.account === '123456789' && parseInt(formData.get('reading')) < 1500 && !formData.get('force')) {
             return { 
                status: 'error', 
                code: 'VALUE_DECREASED', 
                valuepreviousmonth: 1500 
            };
        }
        return { status: 'accepted' };
    },

    async checkSupplierKey(key) {
        // ... (мок)
        if (key === 'SUPPLIERKEY123') {
            return { status: 'success' };
        }
        return { status: 'error', message: 'Invalid key' };
    },

    async getSupplierReport(data) {
        // ... (мок)
        return { status: 'ready', filename: 'report.csv' };
    }
};

// =======================================================================
// 3. ОСНОВНЫЕ ФУНКЦИИ РЕНДЕРИНГА И НАВИГАЦИИ (Без изменений)
// =======================================================================

const T = (key, ...args) => {
    // Использует глобальный window.texts
    const keys = key.split('.');
    let text = window.texts[state.currentLang]; 
    for (const k of keys) {
        const mappedKey = OCR_KEY_MAP[k] || k;
        if (!text || !text[mappedKey]) return `MISSING_TEXT[${state.currentLang}.${key}]`;
        text = text[mappedKey];
    }
    return typeof text === 'function' ? text(...args) : text;
};

const setLanguage = (lang) => {
    state.currentLang = lang;
    state.katoCache = { '1': [] }; 
    document.querySelector('.lang-switch .active').classList.remove('active');
    document.querySelector(`[data-lang="${lang}"]`).classList.add('active');
    document.documentElement.lang = (lang === 'kz' ? 'kk' : 'ru');
    renderPage(state.currentPage);
};

const renderPage = async (pageName, error = null) => {
    state.currentPage = pageName;
    const app = document.getElementById('app');
    let html = '';

    switch (pageName) {
        case 'home': html = await renderHomePage(); break;
        case 'choose_service_type': html = renderChooseServiceTypePage(); break;
        case 'input_account': html = renderInputAccountPage(error); break;
        case 'input_contract': html = renderInputContractPage(error); break;
        case 'supplier_auth': html = renderSupplierAuthPage(error); break;
        case 'input_readings': html = await renderInputReadingsPage(error); break;
        case 'supplier_report': html = renderSupplierReportPage(error); break;
        default: html = `<h2>${T('header.home')}</h2><p>404: Page not found</p>`;
    }

    app.innerHTML = html;
    attachEventListeners(pageName);
};

// =======================================================================
// 4. РЕНДЕР-ФУНКЦИИ (Без изменений)
// =======================================================================

async function renderHomePage() {
    const level1Data = await workerAPI.getKatoLevels();

    const renderSelect = (id, label, data = [], disabled = true) => {
        let options = data.map(item => `<option value="${item.code}">${item.name}</option>`).join('');
        return `
            <label for="${id}">${label}</label>
            <select id="${id}" data-level="${id.slice(-1)}" required ${disabled ? 'disabled' : ''}>
                <option value="">${T('home.select_placeholder') || T('home.continue')}</option>
                ${options}
            </select>
        `;
    };
    
    return `
        <h1 class="main-title">${T('home.title')}</h1>
        <form id="katoForm">
            ${renderSelect('level1', T('home.level1'), level1Data, false)}
            ${renderSelect('level2', T('home.level2'))}
            ${renderSelect('level3', T('home.level3'))}
            ${renderSelect('level4', T('home.level4'))}
            
            <button type="submit" id="continueBtn" class="button" disabled>${T('home.continue')}</button>
        </form>
        <div class="ad-slot ad-slot-main" style="width: 728px; height: 90px;">[Слот A] Реклама</div>
    `;
}

function renderChooseServiceTypePage() {
    const services = T('choose_service.services');
    const types = T('choose_service.types');

    return `
        <h2>${T('choose_service.title')}</h2>
        <div id="serviceSelection" style="display: flex; gap: 15px; margin-bottom: 30px;">
            ${Object.keys(services).map(key => `
                <button data-service="${key}" class="button service-btn" style="background: ${state.service === key ? '#007BFF' : '#6C757D'}">
                    ${services[key]}
                </button>
            `).join('')}
        </div>

        <h3>${T('choose_service.choose_type_label')}</h3>
        <div id="typeSelection" style="display: flex; gap: 15px; margin-bottom: 20px;">
            ${Object.keys(types).map(key => `
                <button data-type="${key}" class="button type-btn" style="background: ${state.clientType === key ? '#007BFF' : '#6C757D'};">
                    ${types[key]}
                </button>
            `).join('')}
        </div>
        <div class="ad-slot ad-slot-service" style="width: 300px; height: 250px;">[Слот B] Реклама</div>
    `;
}

function renderInputAccountPage(error) {
    return `
        <h2>${T('input_account.title')}</h2>
        <p class="info-text">${T('input_account.instruction')}</p>
        <form id="flAuthForm">
            <input type="text" id="accountInput" placeholder="${T('input_account.title')}" value="${state.account || ''}" required>
            ${error ? `<p class="error-text">${error}</p>` : ''}
            <button type="submit" class="button">${T('input_account.submit')}</button>
        </form>
        <p class="error-text" style="font-style: italic; margin-top: 20px;">
            ${T('input_account.warning_dates')}
        </p>
    `;
}

function renderInputContractPage(error) {
    return `
        <h2>${T('input_contract.title')}</h2>
        <form id="ulAuthForm">
            <label for="contractNumber">${T('input_contract.field_number')}</label>
            <input type="text" id="contractNumber" placeholder="${T('input_contract.field_number')}" value="${state.contract || ''}" required>
            
            <label for="contractDate">${T('input_contract.field_date')}</label>
            <input type="date" id="contractDate" required value="${state.contractDate || ''}">
            
            ${error ? `<p class="error-text">${error}</p>` : ''}
            <button type="submit" class="button">${T('input_contract.submit')}</button>
        </form>
        <p class="error-text" style="font-style: italic; margin-top: 20px;">
            ${T('input_contract.warning_dates')}
        </p>
    `;
}

function renderSupplierAuthPage(error) {
    return `
        <h2>${T('supplier.auth_title')}</h2>
        <form id="supplierAuthForm">
            <input type="password" id="keyInput" placeholder="${T('supplier.auth_title')}" required>
            ${error ? `<p class="error-text">${error}</p>` : ''}
            <button type="submit" class="button">${T('supplier.login')}</button>
        </form>
    `;
}

async function renderInputReadingsPage(errorData = null) {
    state.lastReadings = await workerAPI.getLastReadings({ 
        account: state.account, 
        service: state.service 
    });

    const isFL = state.clientType === 'FL';
    const serviceNameGenitive = getServiceGenitive(state.service);
    const readings = isFL ? [0] : [0]; 

    const previousHtml = state.lastReadings 
        ? `<p>${T('input_readings.previous', state.lastReadings.value, state.lastReadings.date)}</p>` 
        : '';
    
    const renderMeterBlock = (index, value = '') => `
        <div class="meter-block" data-meter-index="${index}">
            ${!isFL ? `<h4>Счётчик #${index + 1}</h4>` : ''}
            <label>${T('input_readings.title')}</label>
            <input type="number" step="1" inputmode="numeric" class="reading-input" name="reading" value="${value}" required>
            <p class="info-text">${T('input_readings.photo_instruction', serviceNameGenitive)}</p>
            <input type="file" accept="image/*" capture="environment" class="photo-input" name="photo" required>
        </div>
    `;

    let errorBanner = '';
    let confirmButtons = '';
    
    if (errorData && errorData.code) {
        const errorCode = errorData.code;
        const errorText = T(`ocr.${errorCode}`); 
        const bannerClass = errorCode === 'OCR_ATTEMPTS_EXCEEDED' ? 'banner-critical' : 'banner-warning';
        errorBanner = `<div class="banner ${bannerClass}"><span style="margin-right: 10px;">⚠️</span>${errorText}</div>`;
        
        if (errorCode === 'VALUE_DECREASED') {
            confirmButtons = `
                <div style="margin-top: 20px;">
                    <button type="submit" id="forceSendBtn" class="button">${T('ocr.confirm_send')}</button>
                    <button id="editBtn" class="button" type="button" style="background: #6C757D;">${T('ocr.edit')}</button>
                </div>
            `;
        }
    }

    let html = `
        <h2>${T('choose_service.services')[state.service]}</h2>
        ${previousHtml}
        ${errorBanner}
        <form id="readingsForm">
            <div id="metersContainer">
                ${readings.map(renderMeterBlock).join('')}
            </div>

            ${!isFL ? `
                <p class="info-text" style="color: #17A2B8; margin-bottom: 10px;">
                    ${T('input_readings.ul.hint', serviceNameGenitive)}
                </p>
                <button type="button" id="addMeterBtn" class="add-meter-btn">${T('input_readings.ul.add_meter')}</button>
            ` : ''}

            ${confirmButtons || `<button type="submit" id="sendBtn" class="button" disabled>${T('input_readings.submit')}</button>`}
        </form>
    `;

    if (errorData && errorData.status === 'accepted') {
        html = `
            <div style="text-align: center; padding: 50px;">
                <p class="success-text" style="font-size: 24px; font-weight: bold;">${T('input_readings.success')}</p>
                <div class="ad-slot ad-slot-success" style="width: 468px; height: 60px;">[Слот C] Реклама</div>
                <div style="margin-top: 40px;">
                    <button id="otherReadingsBtn" class="button">${T('input_readings.btn_other')}</button>
                    <button id="homeBtn" class="button" style="background: #6C757D;">${T('input_readings.btn_home')}</button>
                </div>
            </div>
        `;
    }

    return html;
}

function renderSupplierReportPage(error) {
    return `
        <h2>${T('supplier.report.period')}</h2>
        <p class="info-text">
            ${T('home.level4')}: ${state.KATO || 'Не выбран'}
        </p>
        <form id="reportForm">
            <label>${T('supplier.report.period')}</label>
            <input type="month" id="reportMonth" required style="width: 200px; display: block;">
            <label>Выберите формат:</label>
            <select id="reportFormat" style="width: 200px; display: block;">
                <option value="csv">CSV</option>
                <option value="xlsx">Excel</option>
            </select>
            ${error ? `<p class="error-text">${error}</p>` : ''}
            <button type="submit" class="button">${T('supplier.report.generate')}</button>
        </form>
        <div id="reportResult" style="margin-top: 30px;"></div>
    `;
}

// =======================================================================
// 5. ОБРАБОТЧИКИ СОБЫТИЙ (EVENT LISTENERS) (Без изменений)
// =======================================================================

function attachEventListeners(pageName) {
    document.getElementById('burgerBtn').addEventListener('click', () => {
        document.getElementById('mainNav').classList.toggle('open');
    });

    document.querySelectorAll('.lang-switch span').forEach(span => {
        span.addEventListener('click', (e) => setLanguage(e.target.dataset.lang));
    });
    
    document.querySelectorAll('.nav a').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            if (e.target.dataset.page === 'home') {
                state.KATO = state.service = state.clientType = null;
                state.katoCache = { '1': [] };
                renderPage('home');
            } else {
                alert(`Переход на страницу: ${e.target.textContent} (информация)`);
            }
        });
    });

    switch (pageName) {
        case 'home': handleHomePageEvents(); break;
        case 'choose_service_type': handleChooseServiceTypeEvents(); break;
        case 'input_account': document.getElementById('flAuthForm').addEventListener('submit', (e) => handleAuthSubmit(e, 'FL')); break;
        case 'input_contract': document.getElementById('ulAuthForm').addEventListener('submit', (e) => handleAuthSubmit(e, 'UL')); break;
        case 'supplier_auth': document.getElementById('supplierAuthForm').addEventListener('submit', (e) => handleAuthSubmit(e, 'supplier')); break;
        case 'input_readings': handleInputReadingsEvents(); break;
        case 'supplier_report': handleSupplierReportEvents(); break;
    }
}

// --- Обработчики HOME (Логика КАТО) ---
function handleHomePageEvents() {
    const btn = document.getElementById('continueBtn');
    const selects = [
        document.getElementById('level1'),
        document.getElementById('level2'),
        document.getElementById('level3'),
        document.getElementById('level4')
    ];

    /**
     * Проверяет, является ли выбранный код KATO последним *существующим* уровнем 
     * и обновляет кнопку.
     */
    const updateKATOState = async () => {
        let lastSelectedValue = '';
        let lastSelectedIndex = -1;
        
        // 1. Находим последний выбранный код KATO и его индекс
        for (let i = 0; i < 4; i++) {
            const select = selects[i];
            if (select && select.value) {
                lastSelectedValue = select.value;
                lastSelectedIndex = i;
            }
        }
        
        state.KATO = lastSelectedValue;

        if (!lastSelectedValue) {
            btn.disabled = true;
            return;
        }

        // 2. Если выбран последний (4-й) уровень, кнопка активна всегда.
        if (lastSelectedIndex === 3) {
             btn.disabled = false;
             return;
        }
        
        // 3. Проверяем, существует ли следующий уровень для выбранного кода
        const nextSelectKey = lastSelectedValue;
        const nextLevelData = state.katoCache[nextSelectKey];

        let hasNextLevel;

        if (nextLevelData) {
            // Если данные уже в кэше
            hasNextLevel = nextLevelData.length > 0;
        } else {
            // В редких случаях, когда кэш не успел обновиться, 
            // мы не можем точно сказать, поэтому оставим неактивной
            hasNextLevel = true; 
        }
        
        // Кнопка активна, если следующего уровня НЕТ.
        btn.disabled = hasNextLevel;
    };


    // Динамическая логика KATO (Worker API)
    selects.forEach((select, index) => {
        select.addEventListener('change', async () => {
            const currentCode = select.value;
            const nextIndex = index + 1;
            
            // 1. Очистка и блокировка всех последующих уровней
            for (let i = nextIndex; i < selects.length; i++) {
                selects[i].disabled = true;
                selects[i].innerHTML = `<option value="">${T('home.select_placeholder') || T('home.continue')}</option>`;
                selects[i].classList.remove('active-level'); 
                delete state.katoCache[selects[i].id]; 
            }
            
            // 2. Очистка активности у текущего и установка активности только если выбран элемент
            selects.forEach(s => s.classList.remove('active-level'));
            if (currentCode) {
                 select.classList.add('active-level'); 
            }
            
            // 3. Загрузка и рендеринг следующего уровня (если текущий выбран)
            if (currentCode && nextIndex < selects.length) {
                const nextSelect = selects[nextIndex];
                
                const nextLevelData = await workerAPI.getKatoLevels(currentCode);
                
                if (nextLevelData.length > 0) {
                    const optionsHtml = nextLevelData.map(item => `<option value="${item.code}">${item.name}</option>`).join('');
                    nextSelect.innerHTML = `<option value="">${T('home.select_placeholder') || T('home.continue')}</option>` + optionsHtml;
                    nextSelect.disabled = false;
                }
                
                // 4. Обновление состояния кнопки
                await updateKATOState();

            } else {
                // Если сбросили выбор или дошли до последнего селекта
                await updateKATOState();
            }
        });
    });
    
    // Переход к выбору услуги
    document.getElementById('katoForm').addEventListener('submit', (e) => {
        e.preventDefault();
        if (!btn.disabled && state.KATO) { // Проверяем, что кнопка активна и код выбран
            renderPage('choose_service_type');
        }
    });
    
    // Инициализация кнопки
    updateKATOState(); 
}

// --- Остальные обработчики (без изменений) ---
async function handleAuthSubmit(e, clientType) {
    e.preventDefault();
    let data = { kato: state.KATO, clientType: clientType };
    let errorText = '';
    
    if (clientType === 'FL') {
        const account = document.getElementById('accountInput').value.trim();
        data.account = state.account = account;
        errorText = T('input_account.error_not_found');
    } else if (clientType === 'UL') {
        const contract = document.getElementById('contractNumber').value.trim();
        const contractDate = document.getElementById('contractDate').value;
        data.contract = state.contract = contract;
        data.contractDate = state.contractDate = contractDate;
        errorText = T('input_contract.error_not_found');
    } else if (clientType === 'supplier') {
        const key = document.getElementById('keyInput').value;
        const result = await workerAPI.checkSupplierKey(key);
        if (result.status === 'success') {
            renderPage('supplier_report');
            return;
        }
        renderPage('supplier_auth', T('supplier.error_key'));
        return;
    }

    const result = await workerAPI.checkAccount(data);

    if (result.status === 'success' || result.status === 'skipped') {
        state.clientType = clientType; 
        renderPage('input_readings');
    } else {
        renderPage(e.target.id === 'flAuthForm' ? 'input_account' : 'input_contract', errorText);
    }
}

function handleChooseServiceTypeEvents() {
    const serviceBtns = document.querySelectorAll('.service-btn');
    const typeBtns = document.querySelectorAll('.type-btn');

    serviceBtns.forEach(btn => btn.addEventListener('click', (e) => {
        state.service = e.target.dataset.service;
        serviceBtns.forEach(b => b.style.background = (b.dataset.service === state.service) ? '#007BFF' : '#6C757D');
        if (state.clientType && state.service) navigateToAuth();
    }));

    typeBtns.forEach(btn => btn.addEventListener('click', (e) => {
        const newClientType = e.target.dataset.type;
        if (newClientType === 'supplier') {
            renderPage('supplier_auth');
        } else {
            state.clientType = newClientType;
            typeBtns.forEach(b => b.style.background = (b.dataset.type === state.clientType) ? '#007BFF' : '#6C757D');
            if (state.clientType && state.service) navigateToAuth();
        }
    }));
}

function navigateToAuth() {
    if (state.clientType === 'FL') {
        renderPage('input_account');
    } else if (state.clientType === 'UL') {
        renderPage('input_contract');
    }
}

function getServiceGenitive(serviceKey) {
    const genitiveMap = {
        electricity: state.currentLang === 'kz' ? 'электр энергиясы' : 'электроэнергии',
        hotwater: state.currentLang === 'kz' ? 'ыстық су' : 'горячей воды',
        coldwater: state.currentLang === 'kz' ? 'суық су' : 'холодной воды',
        gas: state.currentLang === 'kz' ? 'газ' : 'газа'
    };
    return genitiveMap[serviceKey] || '';
}

function handleInputReadingsEvents() {
    const readingsForm = document.getElementById('readingsForm');
    const sendBtn = document.getElementById('sendBtn');
    const metersContainer = document.getElementById('metersContainer');
    let meterCount = metersContainer ? metersContainer.children.length : 0;
    
    const checkFormValidity = () => {
        const inputs = readingsForm.querySelectorAll('.reading-input, .photo-input');
        let allFilled = true;
        inputs.forEach(input => {
            if (!input.value) allFilled = false;
        });
        if (sendBtn) sendBtn.disabled = !allFilled;
    };

    const attachInputListeners = () => {
         readingsForm.querySelectorAll('.reading-input, .photo-input').forEach(input => {
            input.addEventListener('input', checkFormValidity);
            input.addEventListener('change', checkFormValidity);
        });
    }

    if (readingsForm) {
        attachInputListeners();
        
        readingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(readingsForm);
            
            const isForceSend = e.submitter && e.submitter.id === 'forceSendBtn';
            if (isForceSend) {
                formData.append('force', 'true');
            }

            const result = await workerAPI.sendReadings(formData);

            if (result.status === 'accepted') {
                renderPage('input_readings', { status: 'accepted' });
            } else if (result.status === 'error') {
                renderPage('input_readings', result); 
            }
        });

        const addMeterBtn = document.getElementById('addMeterBtn');
        if (addMeterBtn) {
            addMeterBtn.addEventListener('click', () => {
                meterCount++;
                const newMeterBlock = document.createElement('div');
                newMeterBlock.className = 'meter-block';
                newMeterBlock.dataset.meterIndex = meterCount - 1;
                const serviceNameGenitive = getServiceGenitive(state.service);
                
                newMeterBlock.innerHTML = `
                    <h4>Счётчик #${meterCount}</h4>
                    <label>${T('input_readings.title')}</label>
                    <input type="number" step="1" inputmode="numeric" class="reading-input" name="reading" required>
                    <p class="info-text">${T('input_readings.photo_instruction', serviceNameGenitive)}</p>
                    <input type="file" accept="image/*" capture="environment" class="photo-input" name="photo" required>
                `;
                metersContainer.appendChild(newMeterBlock);
                attachInputListeners(); 
                checkFormValidity();
            });
        }
        
        const otherReadingsBtn = document.getElementById('otherReadingsBtn');
        const homeBtn = document.getElementById('homeBtn');
        if (otherReadingsBtn) {
            otherReadingsBtn.addEventListener('click', () => {
                state.service = null;
                renderPage('choose_service_type');
            });
        }
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                state.KATO = state.service = state.clientType = null;
                state.katoCache = { '1': [] };
                renderPage('home');
            });
        }
        
        const editBtn = document.getElementById('editBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                renderPage('input_readings', null); 
            });
        }

        checkFormValidity();
    }
}

function handleSupplierReportEvents() {
    const reportForm = document.getElementById('reportForm');
    const reportResult = document.getElementById('reportResult');

    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const monthYear = document.getElementById('reportMonth').value;
        const format = document.getElementById('reportFormat').value;

        if (!monthYear) {
             reportResult.innerHTML = `<p class="error-text">Выберите месяц и год.</p>`;
             return;
        }

        const result = await workerAPI.getSupplierReport({ kato: state.KATO, monthYear, format });

        if (result.status === 'ready') {
            const downloadLink = `
                <p class="success-text">${T('supplier.report.ready')}</p>
                <a href="/reports/${result.filename}" download="${result.filename}" class="button">
                    ${T('supplier.report.download')} (${result.filename})
                </a>
            `;
            reportResult.innerHTML = downloadLink;
        } else {
            reportResult.innerHTML = `<p class="error-text">Не удалось сформировать отчет.</p>`;
        }
    });
}


// =======================================================================
// 6. ИНИЦИАЛИЗАЦИЯ
// =======================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Установка начального языка из DOM, если не задано
    const initialLangElement = document.querySelector('.lang-switch .active');
    if (initialLangElement) {
        state.currentLang = initialLangElement.dataset.lang;
    }
    
    // Начальный рендеринг
    renderPage('home'); 
});
