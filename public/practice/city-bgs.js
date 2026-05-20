/* Shared per-city mural injector. Fetches the 13-city HTML partial and
   inserts the .world-bg-layer divs at the top of <body>, then exposes
   window.applyCityBackground(cityId) so each module can wire its own
   city/world change into the right mural. */
(function () {
  var injected = false;
  var pendingCity = null;

  async function inject() {
    if (injected) return;
    try {
      // Plain relative — module pages always end in .html so the browser's
      // base resolution gives the right /practice/city-bgs.html on prod and
      // /city-bgs.html on the local python http.server preview.
      var res = await fetch('city-bgs.html');
      if (!res.ok) return;
      var html = await res.text();
      var wrap = document.createElement('div');
      wrap.innerHTML = html;
      // Insert each child div at the very top of body, preserving order.
      var nodes = Array.from(wrap.children);
      for (var i = nodes.length - 1; i >= 0; i--) {
        document.body.insertBefore(nodes[i], document.body.firstChild);
      }
      injected = true;
      if (pendingCity) applyCityBackground(pendingCity);
    } catch (e) { /* graceful fail — base paper bg stays */ }
  }

  function applyCityBackground(cityId) {
    if (!injected) { pendingCity = cityId; return; }
    var layers = document.querySelectorAll('.world-bg-layer');
    for (var i = 0; i < layers.length; i++) {
      var el = layers[i];
      el.classList.toggle('active', el.dataset.world === cityId);
    }
  }

  window.applyCityBackground = applyCityBackground;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
