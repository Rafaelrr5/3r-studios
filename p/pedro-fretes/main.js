(function () {
  var PHONE = "5532999200808";
  var base = "https://wa.me/" + PHONE + "?text=";

  function msgFor(kind) {
    if (!kind || kind === "geral") {
      return "Olá, Pedro! Vim pelo site e quero um orçamento.\n\nServiço: \nEndereço ou bairro: \n\n(Se puder, já mando fotos.)";
    }
    return "Olá, Pedro! Vim pelo site e quero um orçamento de " + kind.toLowerCase() + ".\n\nEndereço ou bairro: \n\n(Se puder, já mando fotos.)";
  }

  document.querySelectorAll(".js-wa").forEach(function (a) {
    a.href = base + encodeURIComponent(msgFor(a.getAttribute("data-msg")));
    a.target = "_blank";
    a.rel = "noopener";
  });

  var form = document.getElementById("form-pedido");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var s = Array.prototype.map.call(form.querySelectorAll('input[name="s"]:checked'), function (i) { return i.value; });
      var end = form.end.value.trim();
      var dest = form.dest.value.trim();
      var obs = form.obs.value.trim();
      var t = "Olá, Pedro! Vim pelo site e quero um orçamento.\n\n";
      t += "Serviço: " + (s.length ? s.join(", ") : "") + "\n";
      t += "Endereço ou bairro: " + end + "\n";
      if (dest) t += "Destino: " + dest + "\n";
      if (obs) t += "Detalhes: " + obs + "\n";
      t += "\nJá vou mandar as fotos.";
      window.open(base + encodeURIComponent(t), "_blank", "noopener");
    });
  }

  // reveal on scroll
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && "IntersectionObserver" in window) {
    document.documentElement.classList.add("js");
    var els = document.querySelectorAll(".sec-head, .menu-col, .vcard, .stop, .area-map, .form");
    els.forEach(function (el) { el.classList.add("rv"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }
})();
