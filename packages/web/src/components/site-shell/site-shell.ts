import { resolve } from 'aurelia';
import { IRouter } from '@aurelia/router';
import type { ApiHealth, RuntimeConfig } from '@honeycomb/shared';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';

export class SiteShell {
  private api: ApiService = resolve(ApiService);
  private auth: AuthService = resolve(AuthService);
  private router: IRouter = resolve(IRouter);

  mobileMenuOpen = false;
  authModalOpen = false;
  usernameInput = '';
  authError: string | null = null;
  authWorking = false;
  runtimeConfig: RuntimeConfig | null = null;
  health: ApiHealth | null = null;

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn;
  }

  get username(): string | null {
    return this.auth.username;
  }

  get hasKeychain(): boolean {
    return this.auth.hasKeychain;
  }

  get platformAccount(): string {
    return this.runtimeConfig?.platformAccount ?? (import.meta.env.VITE_HIVE_PLATFORM_ACCOUNT ?? 'honeycomb');
  }

  get statusLabel(): string {
    if (!this.health) {
      return 'API not connected';
    }

    const indexer = this.health.indexer.running ? 'indexer live' : 'indexer idle';
    return `API ready, ${indexer}`;
  }

  get isApiOnline(): boolean {
    return this.health?.status === 'ok';
  }

  async binding(): Promise<void> {
    await Promise.all([
      this.loadRuntimeConfig(),
      this.loadHealth(),
    ]);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  openAuthModal(): void {
    this.authModalOpen = true;
    this.authWorking = false;
    this.authError = null;
  }

  closeAuthModal(): void {
    this.authModalOpen = false;
    this.authWorking = false;
    this.authError = null;
  }

  async signInWithKeychain(): Promise<void> {
    this.authError = null;

    const username = this.usernameInput.trim().toLowerCase();
    if (!username) {
      this.authError = 'Enter your Hive username first.';
      return;
    }

    if (!this.auth.hasKeychain) {
      this.authError = 'Hive Keychain was not detected in this browser.';
      return;
    }

    this.authWorking = true;
    try {
      const ok = await this.auth.loginWithKeychain(username);
      if (ok) {
        this.closeAuthModal();
        return;
      }

      this.authError = 'Keychain sign-in was cancelled or rejected.';
    } catch (error) {
      this.authError = error instanceof Error ? error.message : 'Keychain sign-in failed.';
    } finally {
      this.authWorking = false;
    }
  }

  async signInWithHivesigner(): Promise<void> {
    this.authError = null;
    this.authWorking = true;

    try {
      await this.auth.loginWithHivesigner();
    } catch (error) {
      this.authError = error instanceof Error ? error.message : 'HiveSigner sign-in failed.';
      this.authWorking = false;
    }
  }

  logout(): void {
    this.auth.logout();
  }

  async goToPlayground(): Promise<void> {
    await this.router.load('/playground');
  }

  private async loadRuntimeConfig(): Promise<void> {
    try {
      this.runtimeConfig = await this.api.getConfig();
    } catch {
      this.runtimeConfig = null;
    }
  }

  private async loadHealth(): Promise<void> {
    try {
      this.health = await this.api.getHealth();
    } catch {
      this.health = null;
    }
  }
}
