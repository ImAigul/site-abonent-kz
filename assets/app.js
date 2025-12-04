/* ------------------------------------------
   БАЗОВЫЕ СТИЛИ
------------------------------------------- */

body {
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
    background: #f7f9fc;
    color: #2b2b2b;
}

main {
    max-width: 640px;
    margin: 0 auto;
    padding: 20px;
}

/* ------------------------------------------
   ШАПКА САЙТА
------------------------------------------- */

#main-header {
    background: #0b1f3b;
    color: #ffffff;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.logo {
    font-weight: bold;
    font-size: 22px;
}

/* Меню десктоп */
.menu-desktop {
    display: flex;
    gap: 20px;
}

.menu-desktop button {
    background: transparent;
    color: #ffffff;
    border: none;
    cursor: pointer;
    font-size: 15px;
}

.menu-desktop button:hover {
    color: #d1d7e3;
}

/* Переключатель языка */
#lang-switcher {
    display: flex;
    gap: 6px;
}

.lang-btn {
    background: transparent;
    border: 1px solid #ffffff;
    color: #ffffff;
    padding: 4px 10px;
    border-radius: 4px;
    cursor: pointer;
}

.lang-btn:hover {
    background: #ffffff22;
}

/* Бургер для мобильных */
.burger {
    display: none;
    font-size: 26px;
    cursor: pointer;
}

/* ------------------------------------------
   МОБИЛЬНОЕ МЕНЮ
------------------------------------------- */

.mobile-menu {
    background: #0b1f3b;
    color: white;
    display: flex;
    flex-direction: column;
    padding: 12px;
    gap: 12px;
}

.mobile-menu.hidden {
    display: none;
}

.mobile-menu button {
    background: transparent;
    border: none;
    color: white;
    padding: 6px;
    text-align: left;
    font-size: 16px;
}

.mobile-menu button:hover {
    background: #ffffff22;
}

/* ------------------------------------------
   КНОПКИ И ФОРМЫ
------------------------------------------- */

button {
    cursor: pointer;
    border-radius: 6px;
    border: none;
    font-size: 16px;
}

.btn-primary {
    background: #0b1f3b;
    color: white;
    padding: 12px 18px;
}

.btn-primary:disabled {
    background: #a7a7a7;
}

.btn-secondary {
    background: #eeeeee;
    padding: 10px 14px;
}

select, input[type="text"], input[type="number"], input[type="date"] {
    width: 100%;
    padding: 12px;
    font-size: 16px;
    border: 1px solid #cccccc;
    border-radius: 6px;
    margin-bottom: 16px;
    box-sizing: border-box;
}

input[type="file"] {
    margin-top: 10px;
    margin-bottom: 16px;
}

/* ------------------------------------------
   Тексты предупреждений
------------------------------------------- */

.warning {
    color: #cc0000;
    font-style: italic;
    margin-bottom: 14px;
}

/* ------------------------------------------
   КАРТОЧКИ, БЛОКИ
------------------------------------------- */

.card {
    background: white;
    padding: 18px;
    border-radius: 8px;
    box-shadow: 0 2px 4px #00000015;
    margin-bottom: 20px;
}

/* ------------------------------------------
   АДАПТИВ
------------------------------------------- */

@media (max-width: 768px) {
    .menu-desktop {
        display: none;
    }

    .burger {
        display: block;
        color: white;
    }

    #lang-switcher {
        display: none;
    }
}
