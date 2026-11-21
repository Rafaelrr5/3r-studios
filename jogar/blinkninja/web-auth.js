(function (global) {
  "use strict";

  const DEFAULT_CONFIG = {
    url: "",
    anonKey: "",
    storageKey: "blinkninja.supabase.session",
    autoRefresh: true,
    refreshMarginMs: 60000,
    debug: false
  };

  const listeners = new Set();
  let config = Object.assign({}, DEFAULT_CONFIG, global.SUPABASE_CONFIG || {});
  let currentSession = null;
  let refreshPromise = null;

  function joinUrl(base, path) {
    if (!base) {
      throw new Error("Supabase URL is not configured");
    }
    const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    if (!path) {
      return normalizedBase;
    }
    const trimmedPath = path.startsWith("/") ? path.slice(1) : path;
    return normalizedBase + "/" + trimmedPath;
  }

  function logDebug(message, payload) {
    if (config.debug) {
      if (payload === undefined) {
        console.log("[BlinkNinjaAuth] " + message);
      } else {
        console.log("[BlinkNinjaAuth] " + message, payload);
      }
    }
  }

  function parseResponseBody(text) {
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch (_) {
      return text;
    }
  }

  function extractErrorMessage(data, fallback) {
    if (data && typeof data === "object") {
      if (data.error_description) return String(data.error_description);
      if (data.message) return String(data.message);
      if (data.msg) return String(data.msg);
      if (data.error) return String(data.error);
    }
    if (typeof data === "string" && data.trim() !== "") return data;
    return fallback || "Unexpected error";
  }

  async function request(path, options) {
    const opts = options || {};
    const method = opts.method ? opts.method.toUpperCase() : "GET";
    const headers = new Headers();
    if (!config.anonKey) {
      throw new Error("Supabase anon key is not configured");
    }
    headers.set("apikey", config.anonKey);
    if (opts.accessToken) {
      headers.set("Authorization", "Bearer " + opts.accessToken);
    }
    if (opts.headers) {
      Object.keys(opts.headers).forEach(function (key) {
        const value = opts.headers[key];
        if (value !== undefined && value !== null) {
          headers.set(key, value);
        }
      });
    }

    let body = opts.body;
    if (body !== undefined && body !== null && !(body instanceof FormData)) {
      if (typeof body !== "string") {
        body = JSON.stringify(body);
      }
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    }

    const expectJson = opts.expectJson !== undefined ? Boolean(opts.expectJson) : true;
    const response = await fetch(joinUrl(config.url, path), {
      method: method,
      headers: headers,
      body: body,
      redirect: "manual"
    });

    const text = await response.text();
    const data = expectJson ? parseResponseBody(text) : text;
    const headersArray = [];
    response.headers.forEach(function (value, key) {
      headersArray.push([key, value]);
    });

    const payload = {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: headersArray,
      data: data,
      raw: text
    };

    if (!response.ok) {
      const error = new Error(extractErrorMessage(data, response.statusText));
      error.status = response.status;
      error.statusText = response.statusText;
      error.data = data;
      error.raw = text;
      error.headers = headersArray;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  async function requestRaw(path, options) {
    try {
      return await request(path, options);
    } catch (err) {
      return {
        ok: false,
        status: typeof err.status === "number" ? err.status : 0,
        statusText: err.statusText || "Request Failed",
        headers: Array.isArray(err.headers) ? err.headers : [],
        data: err.data !== undefined ? err.data : null,
        raw: typeof err.raw === "string" ? err.raw : "",
        error: err.message || "Request failed"
      };
    }
  }

  // ── Session helpers ────────────────────────────────────

  function toSession(raw) {
    if (!raw || typeof raw !== "object") return null;
    const expiresIn = typeof raw.expires_in === "number" ? raw.expires_in * 1000 : 3600 * 1000;
    const expiresAt = raw.expires_at ? Number(raw.expires_at) * 1000 : Date.now() + expiresIn;
    return {
      accessToken: raw.access_token || "",
      refreshToken: raw.refresh_token || "",
      tokenType: raw.token_type || "bearer",
      expiresAt: expiresAt,
      user: raw.user || null,
      raw: raw
    };
  }

  function cloneSession(session) {
    if (!session) return null;
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      tokenType: session.tokenType,
      expiresAt: session.expiresAt,
      user: session.user ? Object.assign({}, session.user) : null
    };
  }

  function saveSession(session) {
    try {
      if (!session) {
        global.localStorage.removeItem(config.storageKey);
        return;
      }
      global.localStorage.setItem(config.storageKey, JSON.stringify({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        tokenType: session.tokenType,
        expiresAt: session.expiresAt,
        user: session.user
      }));
    } catch (err) {
      logDebug("Failed to persist session", err);
    }
  }

  function loadSessionFromStorage() {
    try {
      const stored = global.localStorage.getItem(config.storageKey);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (!parsed || typeof parsed !== "object") return null;
      return {
        accessToken: parsed.accessToken || "",
        refreshToken: parsed.refreshToken || "",
        tokenType: parsed.tokenType || "bearer",
        expiresAt: typeof parsed.expiresAt === "number" ? parsed.expiresAt : Date.now(),
        user: parsed.user || null
      };
    } catch (err) {
      logDebug("Failed to restore session", err);
      return null;
    }
  }

  function getStorageValue(key) {
    if (!key) return "";
    try {
      return global.localStorage.getItem(String(key)) || "";
    } catch (err) {
      logDebug("Failed to read storage value", err);
      return "";
    }
  }

  function setStorageValue(key, value) {
    if (!key) return false;
    try {
      global.localStorage.setItem(String(key), value == null ? "" : String(value));
      return true;
    } catch (err) {
      logDebug("Failed to persist storage value", err);
      return false;
    }
  }

  function notify(event) {
    const snapshot = cloneSession(currentSession);
    listeners.forEach(function (fn) {
      try { fn({ event: event, session: snapshot }); } catch (err) {
        console.error("BlinkNinjaAuth listener error", err);
      }
    });
  }

  function setSession(session, event) {
    currentSession = session;
    saveSession(session);
    notify(event || (session ? "session_updated" : "session_cleared"));
  }

  function isSessionExpired(session) {
    if (!session || !session.expiresAt) return true;
    return Date.now() >= session.expiresAt - (config.refreshMarginMs || 0);
  }

  function willExpireSoon(session) {
    if (!session || !session.expiresAt) return true;
    return Date.now() + (config.refreshMarginMs || 0) >= session.expiresAt;
  }

  async function refreshSession() {
    if (!currentSession || !currentSession.refreshToken) {
      throw new Error("No refresh token available");
    }
    if (refreshPromise) return refreshPromise;
    refreshPromise = request("auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: { refresh_token: currentSession.refreshToken }
    })
      .then(function (result) {
        const session = toSession(result.data);
        if (!session) throw new Error("Invalid refresh response");
        if (!session.user && currentSession.user) session.user = currentSession.user;
        setSession(session, "token_refreshed");
        return cloneSession(session);
      })
      .catch(function (err) {
        setSession(null, "session_invalidated");
        throw err;
      })
      .finally(function () { refreshPromise = null; });
    return refreshPromise;
  }

  async function ensureSessionFresh() {
    if (!currentSession || !currentSession.accessToken) return null;
    if (!config.autoRefresh) {
      if (isSessionExpired(currentSession)) {
        setSession(null, "session_expired");
        return null;
      }
      return cloneSession(currentSession);
    }
    if (willExpireSoon(currentSession)) {
      try { return await refreshSession(); } catch (err) {
        logDebug("Failed to refresh session", err);
        throw err;
      }
    }
    return cloneSession(currentSession);
  }

  // ── Anonymous auth ─────────────────────────────────────

  async function signInAnonymously() {
    const result = await request("auth/v1/signup", {
      method: "POST",
      body: {}
    });
    const raw = result.data || {};
    const sessionData = raw.session || raw;
    const session = toSession(sessionData);
    if (!session) throw new Error("Failed to create anonymous session");
    session.user = raw.user || sessionData.user || null;
    setSession(session, "signed_in");
    return cloneSession(session);
  }

  async function signOut() {
    if (!currentSession || !currentSession.accessToken) {
      setSession(null, "signed_out");
      return;
    }
    try {
      await request("auth/v1/logout", {
        method: "POST",
        body: {},
        accessToken: currentSession.accessToken
      });
    } catch (err) {
      logDebug("Logout request failed", err);
    } finally {
      setSession(null, "signed_out");
    }
  }

  async function fetchUser(forceRefresh) {
    const session = await ensureSessionFresh();
    if (!session || !session.accessToken) return null;
    if (!forceRefresh && session.user) return session.user;
    const result = await request("auth/v1/user", {
      method: "GET",
      accessToken: session.accessToken
    });
    if (currentSession) {
      currentSession.user = result.data || null;
      setSession(currentSession, "user_updated");
    }
    return result.data || null;
  }

  // ── Nickname helpers ───────────────────────────────────

  async function isNicknameAvailable(nickname) {
    if (!nickname) throw new Error("Nickname é obrigatório");
    const result = await requestRaw("rest/v1/rpc/is_nickname_available", {
      method: "POST",
      body: { p_nickname: nickname },
      accessToken: currentSession ? currentSession.accessToken : undefined
    });
    if (result.ok) {
      if (typeof result.data === "boolean") return result.data;
      if (typeof result.data === "string") return result.data.toLowerCase() === "true";
    }
    return false;
  }

  async function claimNickname(nickname) {
    if (!currentSession || !currentSession.accessToken) {
      throw new Error("Sessão não disponível");
    }
    const result = await request("rest/v1/rpc/claim_nickname", {
      method: "POST",
      body: { p_nickname: nickname },
      accessToken: currentSession.accessToken
    });
    return true;
  }

  // ── Public API ─────────────────────────────────────────

  function getSessionSync() {
    return cloneSession(currentSession);
  }

  async function getSession() {
    return await ensureSessionFresh();
  }

  function onAuthStateChange(listener) {
    if (typeof listener !== "function") throw new Error("Listener must be a function");
    listeners.add(listener);
    return function () { listeners.delete(listener); };
  }

  function configure(options) {
    const opts = options || {};
    config = Object.assign({}, config, opts);
    return Object.assign({}, config);
  }

  function init() {
    currentSession = loadSessionFromStorage();
    if (!currentSession) return null;
    if (!currentSession.accessToken) {
      setSession(null, "session_invalidated");
      return null;
    }
    if (isSessionExpired(currentSession)) {
      setSession(null, "session_expired");
      return null;
    }
    notify("session_restored");
    if (config.autoRefresh) {
      ensureSessionFresh().catch(function (err) {
        logDebug("Auto refresh failed on init", err);
      });
    }
    return cloneSession(currentSession);
  }

  const api = {
    configure: configure,
    signInAnonymously: signInAnonymously,
    signOut: signOut,
    getSession: getSession,
    getSessionSync: getSessionSync,
    getUser: fetchUser,
    refreshSession: refreshSession,
    onAuthStateChange: onAuthStateChange,
    isNicknameAvailable: isNicknameAvailable,
    claimNickname: claimNickname,
    getStorageValue: getStorageValue,
    setStorageValue: setStorageValue,
    request: request,
    requestRaw: requestRaw,
    _debugSetSession: setSession,
    has_method: function (name) {
      return typeof api[name] === "function";
    },
    call: function (method) {
      var args = Array.prototype.slice.call(arguments, 1);
      if (typeof api[method] === "function") {
        return api[method].apply(null, args);
      }
      throw new TypeError("Method '" + method + "' is not a function on BlinkNinjaAuth");
    }
  };

  init();

  global.BlinkNinjaAuth = api;
})(typeof window !== "undefined" ? window : this);
