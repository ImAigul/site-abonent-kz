let state = {
  lang: "kz",
  currentPage: "home",
  clientType: null,
  kato: {},
  account: null,
  contractNumber: null,
  contractDate: null,
  service: null
};

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(`page-${id}`).classList.add("active");
  state.currentPage = id;
}

showPage("home");

// дальше — логика, которую будем добавлять постепенно
