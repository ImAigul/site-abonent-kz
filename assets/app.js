// =======================================================================
// 1. ГЛОБАЛЬНОЕ СОСТОЯНИЕ (STATE)
// =======================================================================
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
    katoData: { // Мок данных для KATO
        '1': [{ code: '190000000', name: 'Алматы қаласы' }, { code: '100000000', name: 'Астана қаласы' }],
        '190000000': [{ code: '191000000', name: 'Алатау ауданы' }],
        '191000000': [], // Имитация отсутствия 3-го уровня
        '100000000': [{ code: '101000000', name: 'Район А' }, { code: '102000000', name: 'Район Б' }]
    }
};

// =======================================================================
// 2. API-ЗАГЛУШКА (MOCK WORKER API)
// =======================================================================
const mockWorkerAPI = {
    KATO_READINESS_MAP: ['100000000', '190000000'], // КАТО для верификации

    // 2.1. Имитация получения уровней KATO (из Google Sheets)
    async getKatoLevels(parentCode = null) {
        if (!parentCode) {
            return state.katoData['1'];
        }
        // Получение следующего уровня (Mock)
        return state.katoData[parentCode] || []; 
    },

    async checkAccount(data) {
        const isReady = this.KATO_READINESS_MAP.includes(data.kato);
        if (!isReady) {
            console.log('API: KATO не готов. Проверка пропущена.');
            return { status: 'skipped' };
        }
        if (data.clientType === 'FL' && data.account === '123456789') {
            return { status: 'success' };
        }
        if (data.clientType === 'UL' && data.contract === '987' && data.contractDate === '2020-01-01') {
            return { status: 'success' };
        }
        return { status: 'error', message: 'Not found' };
    },

    async getLastReadings(data) {
        if (state.account === '123456789' && state.service === 'electricity') {
            return { value: 1500, date: '05.11.2025' };
        }
        return null;
    },

    async sendReadings(formData) {
        // Имитация VALUE_DECREASED (Шаг 5)
        if (state.clientType === 'FL' && state.account === '123456789' && formData.get('reading') < 1500) {
             return { 
                status: 'error', 
                code: 'VALUE_DECREASED', 
                valuepreviousmonth: 1500 
            };
        }
        // Имитация OCR_MISMATCH (Шаг 2)
        // if (state.service === 'hotwater') {
        //     return { status: 'error', code: 'OCR_MISMATCH' };
        // }
        // Имитация OCR_ATTEMPTS_EXCEEDED
        // if (state.service === 'gas') {
        //     return { status: 'error', code: 'OCR_ATTEMPTS_EXCEEDED' };
        // }
        
        return { status: 'accepted' };
    },

    async checkSupplierKey(key) {
        if (key === 'SUPPLIERKEY123') {
            return { status: 'success' };
        }
        return { status: 'error', message: 'Invalid key' };
    },

    async getSupplierReport(data) {
        return { status: 'ready', filename: 'report.csv' };
    }
};

// =======================================================================
// 3. ОСНОВНЫЕ ФУНКЦИИ РЕНДЕРИНГА И НАВИГАЦИИ
// =======================================================================

// 2.2. Маппер ключей ошибок OCR (Критическое исправление)
const OCR_KEY_MAP = {
    OCR_UNREADABLE: 'unreadable',
    OCR_MISMATCH: 'mismatch',
    OCR_ATTEMPTS_EXCEEDED: 'attempts',
    VALUE_DECREASED: 'decreased'
};

// Получает тексты для текущего языка
const T = (key, ...args) => {
    const keys = key.split('.');
    let text = texts[state.currentLang];
    for (const k of keys) {
        // Если ключ — это код OCR, используем маппер
        const mappedKey = OCR_KEY_MAP[k] || k;
        if (!text || !text[mappedKey]) return `MISSING_TEXT[${state.currentLang}.${key}]`;
        text = text[mappedKey];
    }
    return typeof text === 'function' ? text(...args) : text;
};

// Переключение языка
const setLanguage = (lang) => {
    state.currentLang = lang;
    document.querySelector('.lang-switch .active').classList.remove('active');
    document.querySelector(`[data-lang="${lang}"]`).classList.add('active');
    document.documentElement.lang = (lang === 'kz' ? 'kk' : 'ru');
    renderPage(state.currentPage);
};

// Основная функция маршрутизации и рендеринга
const renderPage = async (pageName, error = null) => {
    state.currentPage = pageName;
    const app = document.getElementById('app');
    let html = '';

    // --- Логика рендеринга по страницам ---

    switch (pageName) {
        case 'home':
            html = await renderHomePage();
            break;
        case 'choose_service_type':
            html = renderChooseServiceTypePage();
            break;
        case 'input_account':
            html = renderInputAccountPage(error);
            break;
        case 'input_contract':
            html = renderInputContractPage(error);
            break;
        case 'supplier_auth':
            html = renderSupplierAuthPage(error);
            break;
        case 'input_readings':
            html = await renderInputReadingsPage(error);
            break;
        case 'supplier_report':
            html = renderSupplierReportPage(error);
            break;
        default:
            html = `<h2>${T('header.home')}</h2><p>404: Page not found</p>`;
    }

    app.innerHTML = html;
    attachEventListeners(pageName);
};

// =======================================================================
// 4. РЕНДЕР-ФУНКЦИИ ДЛЯ КАЖДОЙ СТРАНИЦЫ
// =======================================================================

async function renderHomePage() {
    // 2.1. Теперь KATO строится из MOCK Worker API (имитация Google Sheets)
    const level1Data = await mockWorkerAPI.getKatoLevels();

    const renderSelect = (id, label, data = [], disabled = true) => {
        let options = data.map(item => `<option value="${item.code}">${item.name}</option>`).join('');
        return `
            <label for="${id}">${label}</label>
            <select id="${id}" data-level="${id.slice(-1)}" required ${disabled ? 'disabled' : ''}>
                <option value="">--</option>
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
                <button data-type="${key}" class="button type-btn" style="background: #007BFF;">
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
    state.lastReadings = await mockWorkerAPI.getLastReadings({ 
        account: state.account, 
        service: state.service 
    });

    const isFL = state.clientType === 'FL';
    const serviceNameGenitive = getServiceGenitive(state.service);
    const readings = isFL ? [0] : [0]; // 2.4. Временно 1 блок для ЮЛ

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

    // Отображение ошибки верификации
    let errorBanner = '';
    let confirmButtons = '';
    
    if (errorData && errorData.code) {
        const errorCode = errorData.code;
        const errorText = T(`ocr.${errorCode}`); // Используем маппинг в T()
        const bannerClass = errorCode === 'OCR_ATTEMPTS_EXCEEDED' ? 'banner-critical' : 'banner-warning';
        errorBanner = `<div class="banner ${bannerClass}"><span style="margin-right: 10px;">⚠️</span>${errorText}</div>`;
        
        // Шаг 5: Для VALUE_DECREASED показываем кнопки
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

    // Если отправка успешна
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
    // 2.5. Исправлен заголовок (не повторяем "Ключ доступа")
    return `
        <h2>${T('supplier.report.period')}</h2>
        <p class="info-text">
            ${T('home.level4')}: ${state.KATO}
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
        
        <div id="reportResult" style="margin-top: 30px;">
            </div>
    `;
}

// =======================================================================
// 5. ОБРАБОТЧИКИ СОБЫТИЙ (EVENT LISTENERS)
// =======================================================================

function attachEventListeners(pageName) {
    // 5.1. Обработчики шапки (Постоянные)
    document.getElementById('burgerBtn').addEventListener('click', () => {
        document.getElementById('mainNav').classList.toggle('open');
    });

    document.querySelectorAll('.lang-switch span').forEach(span => {
        span.addEventListener('click', (e) => setLanguage(e.target.dataset.lang));
    });
    
    document.querySelectorAll('.nav a').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            // Навигация по страницам
            if (e.target.dataset.page === 'home') {
                // Сброс состояния при переходе на главную
                state.KATO = state.service = state.clientType = null;
                renderPage('home');
            } else {
                alert(`Переход на страницу: ${e.target.textContent} (информация)`);
            }
        });
    });


    // 5.2. Обработчики по страницам
    switch (pageName) {
        case 'home':
            handleHomePageEvents();
            break;
        case 'choose_service_type':
            handleChooseServiceTypeEvents();
            break;
        case 'input_account':
            document.getElementById('flAuthForm').addEventListener('submit', (e) => handleAuthSubmit(e, 'FL'));
            break;
        case 'input_contract':
            document.getElementById('ulAuthForm').addEventListener('submit', (e) => handleAuthSubmit(e, 'UL'));
            break;
        case 'supplier_auth':
            document.getElementById('supplierAuthForm').addEventListener('submit', (e) => handleAuthSubmit(e, 'supplier'));
            break;
        case 'input_readings':
            handleInputReadingsEvents();
            break;
        case 'supplier_report':
            handleSupplierReportEvents();
            break;
    }
}

// --- Обработчики HOME ---
function handleHomePageEvents() {
    const btn = document.getElementById('continueBtn');
    const selects = [
        document.getElementById('level1'),
        document.getElementById('level2'),
        document.getElementById('level3'),
        document.getElementById('level4')
    ];

    const updateKATOState = () => {
        let lastSelectedValue = '';
        let isLevelSelected = false; // Флаг: выбран ли хотя бы один уровень
        let isLastExistingLevelSelected = true; // Флаг: выбран ли последний существующий уровень

        for (let i = 0; i < 4; i++) {
            const select = selects[i];
            const nextSelect = selects[i + 1];

            if (select && select.value) {
                lastSelectedValue = select.value;
                isLevelSelected = true;
            }

            // Проверка, есть ли следующий уровень
            if (select && nextSelect && !nextSelect.disabled && nextSelect.options.length > 1 && !select.value) {
                // Следующий уровень существует (согласно опциям), но текущий не выбран
                isLastExistingLevelSelected = false; 
            }
            
            // Если текущий уровень выбран, но следующий уровень пуст в таблице
            if (select && select.value && nextSelect && nextSelect.options.length <= 1) {
                // 2.3. Здесь мы разрешаем продолжить, т.к. этот уровень — последний существующий
                isLastExistingLevelSelected = true;
                break; 
            }
        }
        
        state.KATO = lastSelectedValue;
        // Кнопка активна, если выбран последний существующий уровень
        // ТЗ: если отсутствует 3 и/или 4 уровень, кнопка “Продолжить” работает.
        btn.disabled = !isLevelSelected || !isLastExistingLevelSelected;
        
        // В упрощенной мок-логике мы просто требуем, чтобы что-то было выбрано
        btn.disabled = !lastSelectedValue; 
    };


    // 2.1. И 2.3. Динамическая логика KATO (MOCK)
    selects.forEach((select, index) => {
        select.addEventListener('change', async () => {
            const currentCode = select.value;
            const nextIndex = index + 1;
            
            // Очистка и блокировка всех последующих уровней
            for (let i = nextIndex; i < selects.length; i++) {
                selects[i].disabled = true;
                selects[i].innerHTML = '<option value="">--</option>';
            }

            if (currentCode && nextIndex < selects.length) {
                const nextSelect = selects[nextIndex];
                const nextLevelData = await mockWorkerAPI.getKatoLevels(currentCode);
                
                if (nextLevelData.length > 0) {
                    // Есть следующие уровни: разблокируем и наполняем
                    const optionsHtml = nextLevelData.map(item => `<option value="${item.code}">${item.name}</option>`).join('');
                    nextSelect.innerHTML = '<option value="">--</option>' + optionsHtml;
                    nextSelect.disabled = false;
                } else {
                    // Следующих уровней НЕТ: оставляем заблокированным,
                    // и кнопка "Продолжить" должна работать (обновляется через updateKATOState)
                }
            }
            updateKATOState();
        });
    });
    
    // Переход к выбору услуги
    document.getElementById('katoForm').addEventListener('submit', (e) => {
        e.preventDefault();
        renderPage('choose_service_type');
    });
    
    // Инициализация кнопки
    updateKATOState(); 
}

// --- Обработчики AUTH (FL/UL/SUPPLIER) ---
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
        const result = await mockWorkerAPI.checkSupplierKey(key);
        if (result.status === 'success') {
            renderPage('supplier_report');
            return;
        }
        renderPage('supplier_auth', T('supplier.error_key'));
        return;
    }

    const result = await mockWorkerAPI.checkAccount(data);

    if (result.status === 'success' || result.status === 'skipped') {
        renderPage('input_readings');
    } else {
        renderPage(e.target.id === 'flAuthForm' ? 'input_account' : 'input_contract', errorText);
    }
}

// =======================================================================
// 6. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =======================================================================

// Генерация родительного падежа для текста инструкции к фото
function getServiceGenitive(serviceKey) {
    const lang = state.currentLang;
    const genitive = {
        electricity: { ru: 'электроэнергии', kz: 'электр энергиясының' },
        hotwater: { ru: 'горячей воды', kz: 'ыстық судың' },
        coldwater: { ru: 'холодной воды', kz: 'суық судың' },
        gas: { ru: 'газа', kz: 'газдың' }
    };
    return genitive[serviceKey]?.[lang] || 'УСЛУГИ';
}

// =======================================================================
// 7. ИНИЦИАЛИЗАЦИЯ
// =======================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Начальный рендеринг
    renderPage('home'); 
});
```
