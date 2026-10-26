/**
 * Demo-only access gate.
 *
 * This is NOT authentication. The code is intentionally public, the session is
 * held in sessionStorage, and no credentials are verified by a server. Its only
 * purpose is to separate the storefront from the admin demonstration.
 */
(function () {
  const CFG = Marowa.config;
  const KEY = CFG.demo.sessionKey;
  const MAX_AGE = 2 * 60 * 60 * 1000; // two hours, for tidiness only
  let deniedAdmin = false;

  function storageGet() {
    try {
      return window.sessionStorage.getItem(KEY);
    } catch {
      return null;
    }
  }
  function storageSet(value) {
    try {
      window.sessionStorage.setItem(KEY, value);
      return true;
    } catch {
      return false;
    }
  }
  function storageRemove() {
    try {
      window.sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }

  function current() {
    const raw = storageGet();
    if (!raw) return null;
    try {
      const session = JSON.parse(raw);
      if (!session || !session.startedAt) return null;
      const age = Date.now() - new Date(session.startedAt).getTime();
      if (!Number.isFinite(age) || age < 0 || age > MAX_AGE) {
        storageRemove();
        return null;
      }
      return session;
    } catch {
      storageRemove();
      return null;
    }
  }

  function login(code) {
    if (String(code || '').trim().toUpperCase() !== CFG.demo.accessCode) {
      return { ok: false, error: 'That demonstration code is not correct. The code is shown on this page.' };
    }
    const session = {
      name: 'Demo operator',
      role: 'local-demo',
      demoOnly: true,
      startedAt: new Date().toISOString()
    };
    if (!storageSet(JSON.stringify(session))) {
      return {
        ok: false,
        error: 'Session storage is unavailable in this browser context. Try serving the demo with npm start.'
      };
    }
    return { ok: true, session };
  }

  function logout() {
    storageRemove();
  }

  function nextTarget() {
    try {
      const next = new URLSearchParams(window.location.search).get('next');
      return next === 'admin.html' ? 'admin.html' : 'admin.html';
    } catch {
      return 'admin.html';
    }
  }

  function guardAdmin() {
    if (document.body.getAttribute('data-page') !== 'admin') return;
    if (!current()) {
      deniedAdmin = true;
      window.location.replace('login.html?next=admin.html');
    }
  }

  function renderSessionCard(session) {
    const wrap = document.getElementById('authFormWrap');
    const host = document.getElementById('authSession');
    if (!wrap || !host) return;
    wrap.hidden = true;
    host.hidden = false;
    host.innerHTML = `<div class="session-card">
      <strong>An active demo session exists.</strong>
      <p>${Marowa.ui.escapeHtml(session.name || 'Demo operator')} · started ${Marowa.ui.formatDateTime(
      session.startedAt
    )}. This session lasts until the tab closes or two hours pass.</p>
      <div style="display:flex;flex-wrap:wrap;gap:.5rem">
        <a class="btn btn--primary btn--sm" href="${nextTarget()}">${Marowa.icon(
      'dashboard',
      15
    )} Open admin demo</a>
        <button class="btn btn--outline btn--sm" type="button" id="endSession">${Marowa.icon(
      'logout',
      15
    )} End session</button>
      </div>
    </div>`;
    Marowa.ui.hydrateIcons(host);
    const end = document.getElementById('endSession');
    if (end) {
      end.addEventListener('click', () => {
        logout();
        window.location.reload();
      });
    }
  }

  function initLogin() {
    if (document.body.getAttribute('data-page') !== 'login') return;
    const existing = current();
    if (existing) {
      renderSessionCard(existing);
      return;
    }

    const form = document.getElementById('loginForm');
    const input = document.getElementById('accessCode');
    const error = document.getElementById('accessCodeError');
    const general = document.getElementById('loginError');
    if (!form || !input) return;

    function clearError() {
      if (error) error.textContent = '';
      input.removeAttribute('aria-invalid');
      if (general) {
        general.hidden = true;
        general.textContent = '';
      }
    }

    input.addEventListener('input', clearError);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      clearError();
      const value = input.value.trim();
      if (!value) {
        if (error) error.textContent = 'Enter the demonstration access code.';
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      const result = login(value);
      if (!result.ok) {
        if (error) error.textContent = result.error;
        input.setAttribute('aria-invalid', 'true');
        if (general) {
          general.hidden = false;
          general.textContent = 'Access was not granted. This gate is a demonstration, not production authentication.';
        }
        input.focus();
        input.select();
        return;
      }
      window.location.assign(nextTarget());
    });

    window.setTimeout(() => input.focus(), 80);
  }

  guardAdmin();
  initLogin();

  Marowa.Auth = {
    current,
    login,
    logout,
    isDenied: () => deniedAdmin,
    isDemoOnly: true
  };
})();
