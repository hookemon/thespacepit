/* Practice nav strip — injects a sticky top bar into every module page.
   Reads current city from URL params (?world= / ?city= / ?lang=) or from
   character storage. Builds the right URL per module so you can hop between
   modules WITHIN the same city without going back to the Atlas. */
(function () {
  var CITY_LANGUAGE = {
    brooklyn: null, stlouis: null,
    mexico: 'es', oaxaca: 'es', tulum: 'es', medellin: 'es', madrid: 'es',
    paris: 'fr', berlin: 'de',
    rishikesh: 'hi', varanasi: 'hi', bombay: 'hi',
    tokyo: 'jp',
  };
  // Reverse map for landing on language.html?lang=xx with no city context.
  var LANG_TO_CITY = { es: 'madrid', fr: 'paris', de: 'berlin', hi: 'bombay', jp: 'tokyo' };

  var CITY_NAMES = {
    brooklyn: 'Brooklyn', stlouis: 'St. Louis', mexico: 'Mexico City',
    oaxaca: 'Oaxaca', tulum: 'Tulum', medellin: 'Medellín',
    paris: 'Paris', madrid: 'Madrid', berlin: 'Berlin',
    rishikesh: 'Rishikesh', varanasi: 'Varanasi', bombay: 'Bombay', tokyo: 'Tokyo',
  };

  var MODULES = [
    { id: 'chords',  label: 'chords',  file: 'hop_chords.html',           param: 'world' },
    { id: 'pyramid', label: 'pyramid', file: 'hop_pyramid.html',          param: 'world' },
    { id: 'drums',   label: 'drums',   file: 'finger_drum_practice.html', param: 'city'  },
    { id: 'garden',  label: 'garden',  file: 'garden.html',               param: 'city'  },
    { id: 'lang',    label: 'lang',    file: 'language.html',             param: 'lang'  },
    { id: 'studio',  label: 'studio',  file: 'studio.html',               param: null    },
    { id: 'here',    label: 'here',    file: 'be_here_now.html',          param: null    },
  ];

  function currentFile() {
    var p = (location.pathname || '').split('/').pop();
    return p || 'index.html';
  }

  function currentCity() {
    var params = new URLSearchParams(location.search);
    var c = params.get('world') || params.get('city');
    if (c) return c;
    // Language page uses ?lang= — reverse-map to a representative city so
    // hopping to other modules stays in a coherent place.
    var lang = params.get('lang');
    if (lang && LANG_TO_CITY[lang]) return LANG_TO_CITY[lang];
    // Fall back to character storage (same pattern modules use themselves).
    try {
      var raw = localStorage.getItem('character');
      if (raw) {
        var ch = JSON.parse(raw);
        if (ch && ch.city) return ch.city;
      }
    } catch (e) { /* localStorage blocked — fall through */ }
    return null;
  }

  function hrefFor(mod, city) {
    if (!mod.param) return mod.file;
    if (mod.param === 'lang') {
      var lang = city ? CITY_LANGUAGE[city] : null;
      return lang ? (mod.file + '?lang=' + lang) : mod.file;
    }
    return city ? (mod.file + '?' + mod.param + '=' + city) : mod.file;
  }

  function build() {
    if (document.querySelector('.practice-nav')) return; // already injected
    var here = currentFile();
    var city = currentCity();

    var nav = document.createElement('div');
    nav.className = 'practice-nav';

    var home = document.createElement('a');
    home.className = 'practice-nav-home';
    home.href = 'index.html';
    home.innerHTML = '<span class="practice-nav-mark"></span><span>← atlas</span>';
    nav.appendChild(home);

    if (city && CITY_NAMES[city]) {
      var cityLbl = document.createElement('div');
      cityLbl.className = 'practice-nav-city';
      cityLbl.innerHTML = '<em>' + CITY_NAMES[city] + '</em>';
      nav.appendChild(cityLbl);
    }

    var tabs = document.createElement('div');
    tabs.className = 'practice-nav-tabs';
    MODULES.forEach(function (m) {
      var a = document.createElement('a');
      a.className = 'practice-nav-tab' + (here === m.file ? ' active' : '');
      a.href = hrefFor(m, city);
      a.textContent = m.label;
      tabs.appendChild(a);
    });
    nav.appendChild(tabs);

    document.body.insertBefore(nav, document.body.firstChild);
  }

  // Also wire the existing page header's TheSpacePit brand mark to atlas —
  // Nick wants tapping the wordmark to feel like "home" no matter where you
  // are. We do this from nav.js so we only have to touch one place; every
  // module already inherits .brand from its inline header.
  function wireBrandLink() {
    var brand = document.querySelector('.brand');
    if (!brand || brand.dataset.atlasWired) return;
    brand.dataset.atlasWired = '1';
    brand.style.cursor = 'pointer';
    brand.setAttribute('role', 'link');
    brand.setAttribute('tabindex', '0');
    brand.addEventListener('click', function () { window.location.href = 'index.html'; });
    brand.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = 'index.html'; }
    });
  }

  function bootAll() { build(); wireBrandLink(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
})();
