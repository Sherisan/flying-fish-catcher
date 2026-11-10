/*
 * Flying Fish Catcher · 00-api.js
 * GameEngineAPI live crash client (plain-JS port of duck-season's src/api/liveCrash.ts).
 *
 * The game server runs the rounds: it draws each crash point with its provably fair RNG
 * before betting opens, runs the clock, takes bets, pays cash-outs (by hand or automatic)
 * and keeps the wallet. This file only talks to it over SignalR (/livecrashhub) and
 * converts server times to this page's clock.
 *
 * Session: the lobby launches the game as /?token=<jwt> (the token names the game).
 * In local dev, with no token in the URL, a demo token is fetched from /api/dev-token.
 * The API address defaults to http://localhost:5003; override it with ?api=<url>.
 */
'use strict';

const GAME_ID = 'flying-fish-catcher';
const IS_DEV = location.protocol === 'file:' || ['localhost', '127.0.0.1'].includes(location.hostname);
const API_BASE = (new URLSearchParams(location.search).get('api') || window.GAME_API_URL || 'http://localhost:5003').replace(/\/$/, '');

class LiveCrashClient {
  constructor(gameId) {
    this.gameId = gameId;
    this.conn = null;
    this.token = null;
    this.offset = 0; // serverTime − Date.now()
    this.handlers = {};
  }

  /** performance.now() time of a server timestamp (ms). */
  toLocal(serverMs) { return performance.now() + (serverMs - (Date.now() + this.offset)); }

  async connect() {
    this.loadTokenFromUrl();
    if (!this.token && IS_DEV) await this.fetchDevToken();
    if (!this.token) throw new Error('No game session. Open the game from the lobby.');
    try {
      return await this.open();
    } catch (e) {
      // A saved dev token can outlive its 4 hours: get a fresh one.
      if (!IS_DEV) throw e;
      await this.fetchDevToken();
      return this.open();
    }
  }

  async open() {
    if (this.conn) await this.conn.stop().catch(() => {});
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/livecrashhub`, { accessTokenFactory: () => this.token || '' })
      .withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 10000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
    const h = (name) => (...a) => { const fn = this.handlers[name]; if (fn) fn(...a); };
    conn.on('Round', (r) => h('round')(r));
    conn.on('Tick', (x) => h('tick')(x.m, x.t));
    conn.on('MyBet', (x) => h('myBet')(x.bet, x.balance));
    conn.on('BetPlaced', (b) => h('betPlaced')(b));
    conn.on('CashedOut', (b) => h('cashedOut')(b));
    conn.onreconnecting(() => h('status')('reconnecting', 'Connection lost. Reconnecting…'));
    conn.onreconnected(async () => {
      try { const s = await this.snapshot(); h('status')('online'); h('resync')(s); }
      catch (e) { h('status')('offline', "Can't reach the game server."); }
    });
    conn.onclose(() => h('status')('offline', 'Disconnected from the game server. Reload to play.'));
    this.conn = conn;
    await conn.start();
    const s = await this.snapshot();
    h('status')('online');
    return s;
  }

  async snapshot() {
    const sent = Date.now();
    const s = await this.conn.invoke('GetSnapshot');
    const got = Date.now();
    this.offset = s.state.serverTime - (sent + got) / 2;
    return s;
  }

  /** → { ok, bet, balance, error } */
  placeBet(slot, amount, autoCashOut) { return this.call('PlaceBet', slot, amount, autoCashOut); }
  /** → { ok, balance, error } */
  cancelBet(slot) { return this.call('CancelBet', slot); }
  /** → { ok, multiplier, win, balance, error } */
  cashOut(slot) { return this.call('CashOut', slot); }
  /** → number */
  getBalance() { return this.call('GetBalance'); }

  async call(method, ...args) {
    if (!this.conn || this.conn.state !== signalR.HubConnectionState.Connected) throw new Error("Can't reach the game server.");
    return this.conn.invoke(method, ...args);
  }

  get tokenKey() { return `gameengine_token_${this.gameId}`; }

  // Picks up the launch token (and drops it from the address bar so it isn't shared by
  // copying the URL), falling back to the one saved for this tab.
  loadTokenFromUrl() {
    const key = this.tokenKey;
    const params = new URLSearchParams(location.search);
    const fromUrl = params.get('token');
    if (fromUrl) {
      this.token = fromUrl;
      try { sessionStorage.setItem(key, fromUrl); } catch (e) { /* storage unavailable */ }
      params.delete('token');
      const qs = params.toString();
      history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : '') + location.hash);
    } else {
      try { this.token = sessionStorage.getItem(key); } catch (e) { this.token = null; }
    }
  }

  async fetchDevToken() {
    const res = await fetch(`${API_BASE}/api/dev-token?gameId=${encodeURIComponent(this.gameId)}`);
    if (!res.ok) throw new Error("Can't reach the game server.");
    this.token = (await res.json()).token;
    try { sessionStorage.setItem(this.tokenKey, this.token); } catch (e) { /* storage unavailable */ }
  }
}
