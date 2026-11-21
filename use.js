// Static onboarding: marks the selected app and fills download sizes and hashes.
// Each language has its own translated copy of usar.html; download destinations stay fixed.
(() => {
  const lang = document.documentElement.lang; // the page itself is translated (en/, es/, fr/)
  function selectedApp() {
    document.querySelectorAll('#apps a').forEach(a => {
      if (a.hash === location.hash) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  }
  window.addEventListener('hashchange', selectedApp);
  selectedApp();
  fetch(new URL('downloads/releases.json', document.currentScript.src), {cache:'no-cache'}) // site root, also from /en/
    .then(r => { if (!r.ok) throw new Error('Downloads: HTTP ' + r.status); return r.json(); })
    .then(data => {
      for (const item of data.files) {
        if (!['ExtratoClaro-Windows-x64.zip','Claude-Autosend-Windows-x64.zip'].includes(item.file) || !Number.isSafeInteger(item.bytes) || item.bytes <= 0 || !/^[a-f0-9]{64}$/.test(item.sha256)) throw new Error('Invalid release metadata');
        const id = item.file.startsWith('Extrato') ? 'finance-size' : 'claude-size';
        document.getElementById(id).textContent = new Intl.NumberFormat(lang, {maximumFractionDigits:1}).format(item.bytes / 1048576) + ' MB · Windows x64';
        const p = document.createElement('p');
        p.textContent = item.file + '\nSHA-256: ' + item.sha256;
        document.getElementById('hashes').append(p);
      }
    }).catch(error => { console.warn(error.message); });
})();
