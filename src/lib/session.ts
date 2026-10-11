import { api, ApiError, type AuthData } from './api.ts';
export class SessionChangedError extends Error {
  constructor() {
    super('Сессия изменилась. Повторите действие после входа.');
    this.name = 'SessionChangedError';
  }
}
export class Session {
  token: string | null = null;
  private version = 0;
  private pending: Promise<string> | null = null;
  private pendingController: AbortController | null = null;
  constructor(private apply: (auth: AuthData | null) => void) {}
  clear() {
    this.version++;
    this.pendingController?.abort();
    this.pendingController = null;
    this.pending = null;
    this.token = null;
    this.apply(null);
  }
  private accept(auth: AuthData, version: number): string {
    if (this.version !== version) throw new SessionChangedError();
    this.apply(auth);
    this.token = auth.access_token;
    return this.token;
  }
  async signIn(execute: () => Promise<AuthData>): Promise<AuthData> {
    this.clear();
    const version = this.version;
    const auth = await execute();
    this.accept(auth, version);
    return auth;
  }
  refresh(): Promise<string> {
    if (this.pending) return this.pending;
    const version = this.version;
    const controller = new AbortController();
    this.pendingController = controller;
    const pending = api.auth
      .refresh(controller.signal)
      .then((auth) => this.accept(auth, version))
      .catch((error: unknown) => {
        if (version !== this.version) throw new SessionChangedError();
        throw error;
      })
      .finally(() => {
        if (this.pending === pending) {
          this.pending = null;
          this.pendingController = null;
        }
      });
    this.pending = pending;
    return pending;
  }
  async run<T>(execute: (token: string) => Promise<T>): Promise<T> {
    const version = this.version;
    let token = this.token;
    if (!token) token = await this.refresh();
    if (version !== this.version) throw new SessionChangedError();
    try {
      const value = await execute(token);
      if (version !== this.version) throw new SessionChangedError();
      return value;
    } catch (err) {
      if (version !== this.version) throw new SessionChangedError();
      if (!(err instanceof ApiError) || err.status !== 401) throw err;
      // Another parallel request may already have rotated the token.
      const next =
        this.token && this.token !== token ? this.token : await this.refresh();
      if (version !== this.version) throw new SessionChangedError();
      const value = await execute(next);
      if (version !== this.version) throw new SessionChangedError();
      return value;
    }
  }
}
