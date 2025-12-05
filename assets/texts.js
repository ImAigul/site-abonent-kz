const ABONENT_TEXTS = {
    ru: {
        /* МЕНЮ */
        menu_home: "Главная",
        menu_send: "Передать показания",
        menu_about: "О сервисе",
        menu_contacts: "Контакты",
        menu_help: "Справка",

        /* ГЛАВНАЯ */
        home_title: "Единая платформа для приёма и обработки показаний приборов учёта (ИПУ/ОДПУ).",
        home_choose_service: "Выберите сервис:",
        home_fl: "Для физических лиц",
        home_ul: "Для юридических лиц",
        home_supplier: "Для поставщиков услуг",

        /* КАТО */
        choose_region_level1: "Выберите область или город",
        choose_region_level2: "Выберите город или район",
        choose_region_level3: "Выберите сельский округ или посёлок",
        choose_region_level4: "Выберите населённый пункт",
        choose_continue: "Продолжить",

        /* INPUT ACCOUNT FL */
        input_account_title_fl: "Введите номер лицевого счёта",
        input_account_button: "Проверить",
        input_account_warning: "Внимание! Показания принимаются с 15 по 31 число каждого месяца.",
        input_account_not_found: "Лицевой счёт не найден, введите корректный номер лицевого счета либо обратитесь в абонентский отдел.",

        /* INPUT CONTRACT UL */
        input_account_title_ul: "Введите данные договора",
        input_contract_number: "Номер договора",
        input_contract_date: "Дата договора",
        input_contract_button: "Проверить",
        input_contract_not_found: "Договор не найден, проверьте номер и дату договора либо обратитесь в абонентский отдел.",

        /* УСЛУГИ */
        choose_service_title: "Выберите услугу",
        service_ee: "Электроэнергия",
        service_hw: "Горячая вода",
        service_cw: "Холодная вода",
        service_gas: "Газ",

        /* ПОКАЗАНИЯ */
        previous_readings: "Ваши предыдущие показания: {value} от {date}.",
        readings_warning_input: "Введите показания цифрами",
        ocr_unreadable: "Загруженный снимок нечеткий или на нём отсутствует счётчик. Пожалуйста, загрузите качественное фото.",
        ocr_mismatch: "Показания на снимке не совпадают с введённым значением. Исправьте данные или загрузите новое фото.",
        ocr_attempts_exceeded: "Не удалось верифицировать показания счётчика. Обратитесь в абонентский отдел.",
        readings_decreased: "Текущие показания меньше, чем показания за прошлый месяц.",
        readings_confirm: "Подтвердить отправку?",
        readings_success: "Показания приняты, спасибо!",

        /* ЮЛ */
        ul_add_meter: "+ Добавить счётчик",
        ul_add_meter_hint: "Если у вас несколько счётчиков этой услуги",
        ul_success: "Показания приняты, спасибо!",

        /* ПОСТАВЩИК */
        supplier_key: "Ключ доступа",
        supplier_login: "Войти",
        supplier_key_invalid: "Неверный ключ доступа",
        supplier_period_from: "Период с",
        supplier_period_to: "Период по",
        supplier_format: "Формат выгрузки",
        supplier_generate: "Сформировать отчёт",
    },

    kz: {
        menu_home: "Басты бет",
        menu_send: "Көрсеткіш жіберу",
        menu_about: "Қызмет туралы",
        menu_contacts: "Байланыс",
        menu_help: "Анықтама",

        home_title: "Есептеу құралдарының (ЖЕҚ/ЖҮҚ) көрсеткіштерін қабылдау және өңдеуге арналған бірыңғай платформа.",
        home_choose_service: "Қызметті таңдаңыз:",
        home_fl: "Жеке тұлғалар үшін",
        home_ul: "Заңды тұлғалар үшін",
        home_supplier: "Қызмет көрсетушілер үшін",

        choose_region_level1: "Облысты немесе қаланы таңдаңыз",
        choose_region_level2: "Қаланы немесе ауданды таңдаңыз",
        choose_region_level3: "Ауылдық округті немесе кентті таңдаңыз",
        choose_region_level4: "Елді мекенді таңдаңыз",
        choose_continue: "Жалғастыру",

        input_account_title_fl: "Дербес шот нөмірін енгізіңіз",
        input_account_button: "Тексеру",
        input_account_warning: "Назар аударыңыз! Көрсеткіштер әр айдың 15-і мен 31-і аралығында қабылданады.",
        input_account_not_found: "Дербес шот табылмады, дұрыс жеке шот нөмірін енгізіңіз немесе абоненттік бөлімге хабарласыңыз.",

        input_account_title_ul: "Шарт деректерін енгізіңіз",
        input_contract_number: "Шарт нөмірі",
        input_contract_date: "Шарт күні",
        input_contract_button: "Тексеру",
        input_contract_not_found: "Шарт табылмады, шарт нөмірі мен күнін дұрыс енгізіңіз немесе абоненттік бөлімге хабарласыңыз.",

        choose_service_title: "Қызметті таңдаңыз",
        service_ee: "Электр энергиясы",
        service_hw: "Ыстық су",
        service_cw: "Суық су",
        service_gas: "Газ",

        previous_readings: "Алдыңғы айдағы көрсеткішіңіз: {value}, күні — {date}.",
        readings_warning_input: "Көрсеткіштерді сан түрінде енгізіңіз",
        ocr_unreadable: "Жүктелген сурет анық емес немесе есептегіш көрінбейді. Сапалы сурет жүктеңіз.",
        ocr_mismatch: "Суреттегі көрсеткіш енгізілген мәнмен сәйкес келмейді.",
        ocr_attempts_exceeded: "Есептегіш көрсеткіштерін верификациялау мүмкін болмады. Абоненттік бөлімге хабарласыңыз.",
        readings_decreased: "Ағымдағы көрсеткіштер өткен айдағы көрсеткіштерден аз.",
        readings_confirm: "Жіберуді растау?",
        readings_success: "Көрсеткіш қабылданды, рақмет!",

        ul_add_meter: "+ Есептегіш қосу",
        ul_add_meter_hint: "Егер сізде осы қызметтің бірнеше есептегіші болса",
        ul_success: "Көрсеткіштер қабылданды, рақмет!",

        supplier_key: "Қол жеткізу кілті",
        supplier_login: "Кіру",
        supplier_key_invalid: "Қате кілт",
        supplier_period_from: "Кезеңнің басы",
        supplier_period_to: "Кезеңнің соңы",
        supplier_format: "Пішім",
        supplier_generate: "Есеп жасау",
    }
};
