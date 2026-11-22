(function () {
  var d = document;
  d.documentElement.classList.add('js');

  // Aberto agora? (horário de Brasília, conforme Google Maps)
  try {
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    var get = function (t) { return (parts.find(function (p) { return p.type === t; }) || {}).value; };
    var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    var min = (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10);
    var open = (day >= 1 && day <= 5 && min >= 480 && min < 1080) || (day === 6 && min >= 480 && min < 780);
    var el = d.getElementById('aberto');
    if (el && day >= 0) {
      el.textContent = open ? 'Loja aberta agora · Centro de Cataguases' : 'Loja fechada agora · peça pelo WhatsApp';
      if (open) d.querySelector('.hero__place .dot').classList.add('is-open');
    }
    d.querySelectorAll('.hours tr[data-d]').forEach(function (tr) {
      if (tr.getAttribute('data-d').split(' ').indexOf(String(day)) > -1) tr.classList.add('is-today');
    });
  } catch (e) {}

  // Prévia do cartão + pedido no WhatsApp
  var f = d.getElementById('form-pedido');
  if (f) {
    var map = { 'f-msg': 'prev-msg', 'f-de': 'prev-de', 'f-para': 'prev-para' };
    var empty = { 'prev-msg': 'Sua mensagem aparece aqui.', 'prev-de': '…', 'prev-para': '…' };
    Object.keys(map).forEach(function (id) {
      var input = d.getElementById(id), out = d.getElementById(map[id]);
      input.addEventListener('input', function () { out.textContent = input.value.trim() || empty[map[id]]; });
    });
    var date = d.getElementById('f-data');
    var today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    date.min = today.toISOString().slice(0, 10);

    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = function (n) { var x = f.elements[n]; return x ? String(x.value).trim() : ''; };
      var lines = ['Olá, Quintal das Dálias! Quero fazer um pedido pelo site.', '', '• Presente: ' + v('presente')];
      if (v('para')) lines.push('• Para: ' + v('para'));
      if (v('de')) lines.push('• De: ' + v('de'));
      if (v('msg')) lines.push('• Cartão: "' + v('msg') + '"');
      lines.push('• ' + v('modo'));
      if (v('data')) { var p = v('data').split('-'); lines.push('• Data: ' + p[2] + '/' + p[1] + '/' + p[0]); }
      lines.push('', 'Pode me passar valor e disponibilidade?');
      window.open('https://wa.me/?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
  }

  // Revelar ao rolar
  var items = d.querySelectorAll('.sec-head, .card, .menu__col, .gift, .form, .card-prev, .hours');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el, i) { el.classList.add('rv'); el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });
  }
})();
