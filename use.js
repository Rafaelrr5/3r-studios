// Static onboarding. Translations change text only; download destinations stay fixed.
(() => {
  const pt = {};
  document.querySelectorAll('[data-copy]').forEach(el => { pt[el.dataset.copy] = el.textContent; });
  const copy = {
    'pt-BR': pt,
    en: {
      skip: 'Skip to instructions', language: 'Language', eyebrow: 'GET STARTED', title: 'Download. Open. Use.',
      intro: 'Apps that run on your computer. You do not need to clone a repository or open a terminal.',
      financeIntro: 'View and organise statements from Inter and B3. Your data stays on your computer, without a cloud account.',
      download: 'Download for Windows', extract: 'Right-click the ZIP and choose “Extract all”. Do not run the app from inside the ZIP.',
      financeOpen: 'Inside the ExtratoClaro folder, open ExtratoClaro.exe. The dashboard opens in your browser.',
      financeUse: 'In the dashboard, open “Importar PDF”, select your statement or card bill and import it. Use “Triar” to sort uncategorised expenses.',
      privacyTitle: 'Your data belongs to you', privacy: 'Statements stay on your computer. To quit, use “Fechar o aplicativo” in the Extrato Claro window. Close the app before copying fin.db as a backup.',
      financeLimit: 'The Mercado Pago connection is optional and is not configured in this package. This app is not a bank account or investment advice.',
      claudeIntro: 'Write a task and choose when to send it to Claude Code. Set up the schedule in your browser.',
      claudeOpen: 'Open Abrir-Claude-Autosend.vbs in the extracted folder. Node is already included.',
      claudeUse: 'In the dashboard, choose the time, add a session and write the task. Check the project folder before scheduling.',
      claudeNeedTitle: 'Requires Claude Code', claudeNeed: 'Install Claude Code and sign in with your own account before sending tasks. This package does not include a subscription or Claude access.',
      claudeDocs: 'Official Claude Code installation (new tab)', claudeLimit: 'Keep the computer on and awake. Normal permissions still apply; a task can wait for your approval. Existing-window mode needs an unlocked desktop and can change focus.',
      warningTitle: 'Before opening a program', warning: 'These packages are not digitally signed yet. Windows may display a warning. Only run software from a source you recognise; do not disable your antivirus. Check the file name and hash below.',
      hashTitle: 'Download identification', back: 'Back to projects'
    },
    es: {
      skip: 'Saltar a las instrucciones', language: 'Idioma', eyebrow: 'PARA EMPEZAR', title: 'Descarga. Abre. Usa.',
      intro: 'Aplicaciones que funcionan en tu ordenador. No necesitas clonar un repositorio ni abrir un terminal.',
      financeIntro: 'Consulta y organiza extractos de Inter y B3. Los datos se quedan en tu ordenador, sin cuenta en la nube.',
      download: 'Descargar para Windows', extract: 'Haz clic derecho en el ZIP y elige “Extraer todo”. No ejecutes la aplicación desde el ZIP.',
      financeOpen: 'Dentro de la carpeta ExtratoClaro, abre ExtratoClaro.exe. El panel se abre en el navegador.',
      financeUse: 'En el panel, abre “Importar PDF”, selecciona tu extracto o factura e impórtalo. Usa “Triar” para clasificar gastos sin categoría.',
      privacyTitle: 'Tus datos son tuyos', privacy: 'Los extractos se quedan en tu ordenador. Para salir, pulsa “Fechar o aplicativo” en la ventana de Extrato Claro. Cierra la aplicación antes de copiar fin.db para una copia de seguridad.',
      financeLimit: 'La conexión con Mercado Pago es opcional y no viene configurada. Esta aplicación no es una cuenta bancaria ni asesoramiento de inversión.',
      claudeIntro: 'Escribe una tarea y elige cuándo enviarla a Claude Code. Configura la programación en el navegador.',
      claudeOpen: 'Abre Abrir-Claude-Autosend.vbs en la carpeta extraída. Node ya viene incluido.',
      claudeUse: 'En el panel, elige la hora, añade una sesión y escribe la tarea. Comprueba la carpeta del proyecto antes de programar.',
      claudeNeedTitle: 'Necesita Claude Code', claudeNeed: 'Instala Claude Code e inicia sesión con tu propia cuenta antes de enviar tareas. Este paquete no incluye una suscripción ni acceso a Claude.',
      claudeDocs: 'Instalación oficial de Claude Code (nueva pestaña)', claudeLimit: 'Mantén el ordenador encendido y despierto. Los permisos normales siguen activos; una tarea puede esperar tu aprobación. El modo ventana existente necesita el escritorio desbloqueado y puede cambiar el foco.',
      warningTitle: 'Antes de abrir un programa', warning: 'Estos paquetes aún no tienen firma digital. Windows puede mostrar una alerta. Ejecuta software solo si reconoces su origen; no desactives el antivirus. Comprueba el nombre y el hash del archivo.',
      hashTitle: 'Identificación de las descargas', back: 'Volver a los proyectos'
    },
    fr: {
      skip: 'Aller aux instructions', language: 'Langue', eyebrow: 'POUR COMMENCER', title: 'Téléchargez. Ouvrez. Utilisez.',
      intro: 'Des applications qui tournent sur votre ordinateur. Pas besoin de cloner un dépôt ou d’ouvrir un terminal.',
      financeIntro: 'Consultez et classez vos relevés d’Inter et de B3. Les données restent sur votre ordinateur, sans compte cloud.',
      download: 'Télécharger pour Windows', extract: 'Faites un clic droit sur le ZIP et choisissez “Extraire tout”. Ne lancez pas l’application depuis le ZIP.',
      financeOpen: 'Dans le dossier ExtratoClaro, ouvrez ExtratoClaro.exe. Le tableau de bord s’ouvre dans le navigateur.',
      financeUse: 'Dans le tableau de bord, ouvrez “Importar PDF”, choisissez votre relevé ou facture et importez-le. Utilisez “Triar” pour classer les dépenses sans catégorie.',
      privacyTitle: 'Vos données vous appartiennent', privacy: 'Les relevés restent sur votre ordinateur. Pour quitter, cliquez sur “Fechar o aplicativo” dans la fenêtre d’Extrato Claro. Fermez l’application avant de copier fin.db pour une sauvegarde.',
      financeLimit: 'La connexion Mercado Pago est facultative et n’est pas configurée dans ce paquet. Cette application n’est ni un compte bancaire ni un conseil en investissement.',
      claudeIntro: 'Écrivez une tâche et choisissez quand l’envoyer à Claude Code. Programmez-la dans le navigateur.',
      claudeOpen: 'Ouvrez Abrir-Claude-Autosend.vbs dans le dossier extrait. Node est déjà inclus.',
      claudeUse: 'Dans le tableau de bord, choisissez l’heure, ajoutez une session et écrivez la tâche. Vérifiez le dossier du projet avant de programmer.',
      claudeNeedTitle: 'Nécessite Claude Code', claudeNeed: 'Installez Claude Code et connectez votre propre compte avant d’envoyer des tâches. Ce paquet ne comprend pas d’abonnement ni d’accès à Claude.',
      claudeDocs: 'Installation officielle de Claude Code (nouvel onglet)', claudeLimit: 'Gardez l’ordinateur allumé et éveillé. Les autorisations normales restent actives ; une tâche peut attendre votre accord. Le mode fenêtre existante nécessite un bureau déverrouillé et peut changer le focus.',
      warningTitle: 'Avant d’ouvrir un programme', warning: 'Ces paquets ne sont pas encore signés numériquement. Windows peut afficher un avertissement. N’exécutez un logiciel que si vous reconnaissez son origine ; ne désactivez pas l’antivirus. Vérifiez le nom et le hash du fichier.',
      hashTitle: 'Identification des téléchargements', back: 'Retour aux projets'
    }
  };
  let prefs = {};
  try { const saved = JSON.parse(localStorage.getItem('3r-prefs') || '{}'); if (saved && typeof saved === 'object' && !Array.isArray(saved)) prefs = saved; } catch {}
  const preferred = typeof prefs.lang === 'string' && prefs.lang !== 'auto' ? prefs.lang : navigator.language;
  let lang = Object.hasOwn(copy, preferred) ? preferred : (preferred.startsWith('pt') ? 'pt-BR' : (Object.hasOwn(copy, preferred.split('-')[0]) ? preferred.split('-')[0] : 'en'));
  const select = document.getElementById('language');
  function translate() {
    document.documentElement.lang = lang;
    document.title = copy[lang].eyebrow + ' · 3R Studios';
    select.value = lang;
    document.querySelectorAll('[data-copy]').forEach(el => { el.textContent = copy[lang][el.dataset.copy] || pt[el.dataset.copy]; });
    document.getElementById('apps').setAttribute('aria-label', lang === 'pt-BR' ? 'Aplicativos' : 'Apps');
  }
  select.addEventListener('change', () => {
    lang = select.value;
    translate();
    try { localStorage.setItem('3r-prefs', JSON.stringify({...prefs, lang})); prefs.lang = lang; } catch {}
  });
  function selectedApp() {
    document.querySelectorAll('#apps a').forEach(a => {
      if (a.hash === location.hash) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  }
  window.addEventListener('hashchange', selectedApp);
  translate(); selectedApp();
  fetch('downloads/releases.json', {cache:'no-cache'})
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
