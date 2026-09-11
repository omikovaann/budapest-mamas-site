
// Mobile tooltips for abbr
var tooltip = document.createElement('div');
tooltip.className = 'abbr-tooltip';
document.body.appendChild(tooltip);
var tooltipTimer;

document.querySelectorAll('abbr[title]').forEach(function(abbr) {
  abbr.addEventListener('click', function(e) {
    e.stopPropagation();
    var rect = abbr.getBoundingClientRect();
    tooltip.textContent = abbr.getAttribute('title');
    var top = rect.top - 44;
    if (top < 10) top = rect.bottom + 8;
    var left = Math.min(Math.max(rect.left, 10), window.innerWidth - 260);
    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
    tooltip.classList.add('visible');
    clearTimeout(tooltipTimer);
    tooltipTimer = setTimeout(function() {
      tooltip.classList.remove('visible');
    }, 3000);
  });
});
document.addEventListener('click', function() {
  tooltip.classList.remove('visible');
});


function toggleTheme() {
  var html = document.documentElement;
  var btn = document.getElementById('themeBtn');
  if (html.getAttribute('data-theme') === 'dark') {
    html.removeAttribute('data-theme');
    localStorage.setItem('bp_theme', 'light');
    btn.textContent = '🌙';
  } else {
    html.setAttribute('data-theme', 'dark');
    localStorage.setItem('bp_theme', 'dark');
    btn.textContent = '☀️';
  }
}
document.addEventListener('DOMContentLoaded', function() {
  if (localStorage.getItem('bp_theme') === 'dark') {
    var btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = '☀️';
  }
});

function navTo(id) {
  closeSidebar();
  var target = document.getElementById(id);
  if (target) {
    var top = target.getBoundingClientRect().top + window.pageYOffset - 72;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }
}

function toggleSidebar() {
  var s = document.getElementById("sidebar");
  var o = document.getElementById("overlay");
  var open = s.classList.toggle("open");
  o.classList.toggle("open", open);
}
function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("overlay").classList.remove("open");
}
document.addEventListener("DOMContentLoaded", function() {
  document.querySelectorAll("a[href^='#']").forEach(function(link) {
    link.addEventListener("click", function(e) {
      e.preventDefault();
      closeSidebar();
      var id = this.getAttribute("href").slice(1);
      var target = document.getElementById(id);
      if (target) {
        var offset = 72;
        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: "smooth" });
      }
    });
  });
  var sections = document.querySelectorAll("section[id], div[id]");
  var navItems = document.querySelectorAll(".nav-item");
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        navItems.forEach(function(n) { n.classList.remove("active"); });
        var active = document.querySelector(".nav-item[href=\"#" + entry.target.id + "\"]");
        if (active) active.classList.add("active");
      }
    });
  }, { rootMargin: "-20% 0px -70% 0px" });
  sections.forEach(function(s) { observer.observe(s); });
});

// ===== PREMIUM ACCESS: именные коды вместо одного общего пароля =====
// Проверка кода идёт через Netlify Function (netlify/functions/check-code.js),
// а не напрямую в SheetDB — так ссылка на таблицу с кодами не попадает в код,
// который скачивает браузер посетителя, и весь список кодов нельзя вытащить
// одним GET-запросом.

function premShowPw(btn) {
  var f = btn.closest('.premium-overlay').querySelector('.prem-pw-form');
  f.classList.toggle('open');
  if (f.classList.contains('open')) f.querySelector('input').focus();
}

function premGrantAccess() {
  localStorage.setItem('bp_access', '1');
  document.querySelectorAll('.premium-wrap').forEach(function(w) { w.classList.remove('locked'); });
}

function premShowError(input) {
  input.closest('.prem-pw-form').querySelector('.prem-err').style.display = 'block';
}

function premCheckPw(input) {
  var code = input.value;
  input.disabled = true;

  fetch('/.netlify/functions/check-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: code })
  })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      input.disabled = false;
      if (data && data.valid) {
        premGrantAccess();
      } else {
        premShowError(input);
      }
    })
    .catch(function() {
      input.disabled = false;
      premShowError(input);
    });
}

// ===== ДЕЖУРНЫЕ ТРАВМАТОЛОГИЯ/ХИРУРГИЯ ПО ДНЯМ (baby.html, секция emergency) =====
// Только на странице, где есть виджет — на остальных #dutyDays просто не найдётся.
(function() {
  var daysEl = document.getElementById('dutyDays');
  if (!daysEl) return;

  var H = {
    beth: { n: "Bethesda Gyermekkórház", a: "1146 Budapest, Bethesda u. 3." },
    jan:  { n: "Szent János Kórház", a: "1125 Budapest, Diós árok 1–3.\nКорпус 19, вход для скорой", t: "+3614584525" },
    heim: { n: "Heim Pál", a: "1089 Budapest, Üllői út 86." },
    mann: { n: "Dr. Manninger Jenő Baleseti Központ", a: "1081 Budapest, Fiumei út 17." },
    sem:  { n: "Semmelweis, I. или II. клиника", a: "I. Sz. — 1083 Budapest, Bókay János u. 53–54.\nII. Sz. — 1094 Budapest, Tűzoltó u. 7.", alt: true }
  };
  var SCHED = {
    tE: ["beth", "jan", "beth", "heim", "jan", "beth", "jan"],
    tD: ["heim", "mann", "heim", "mann", "mann", "heim", "mann"],
    sE: ["beth", "jan", "beth", "sem", "sem", "beth", "jan"],
    sD: ["heim", "jan", "heim", "sem", "sem", "heim", "jan"]
  };

  var state = { d: (new Date().getDay() + 6) % 7, z: "E", k: "t" };

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  function dutySet(id, attr, val) {
    var list = document.getElementById(id).getElementsByTagName("button");
    for (var i = 0; i < list.length; i++) {
      list[i].setAttribute("aria-pressed", String(list[i].dataset[attr] === val));
    }
  }

  function dutyRender() {
    var h = H[SCHED[state.k + state.z][state.d]];
    var maps = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(h.n + ", Budapest");
    var html =
      '<p class="duty-card-lbl">Дежурит</p>' +
      '<p class="duty-card-name">' + esc(h.n) + '</p>' +
      '<p class="duty-card-addr">' + esc(h.a) + '</p>' +
      '<a class="duty-act duty-act-fill" href="' + maps + '" target="_blank">Построить маршрут</a>';
    if (h.t) html += '<a class="duty-act" href="tel:' + h.t + '">Позвонить в отделение</a>';
    if (h.alt) html += '<p class="duty-note">Дежурство чередуется по чётности недели. Проверьте на surgossegi.info, прежде чем выезжать.</p>';
    document.getElementById("dutyResult").innerHTML = html;

    dutySet("dutyDays", "d", state.d);
    dutySet("dutyZones", "z", state.z);
    dutySet("dutyKinds", "k", state.k);
  }

  function dutyBind(id, attr, cast) {
    document.getElementById(id).addEventListener("click", function(e) {
      var b = e.target.closest("button");
      if (!b) return;
      state[attr] = cast ? cast(b.dataset[attr]) : b.dataset[attr];
      dutyRender();
    });
  }

  dutyBind("dutyDays", "d", Number);
  dutyBind("dutyZones", "z");
  dutyBind("dutyKinds", "k");
  dutyRender();
})();
