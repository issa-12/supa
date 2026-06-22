import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  expiresAt: string | null;
}

export interface CreatedApiKey extends ApiKey {
  /** The full secret — returned only at creation, never again. */
  key: string;
}

@Injectable({ providedIn: 'root' })
export class ApiKeyService {
  private readonly supabaseService = inject(SupabaseService);

  private async authHeaders(): Promise<Record<string, string>> {
    const session = await this.supabaseService.getCurrentSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not authenticated');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }

  async list(): Promise<ApiKey[]> {
    const res = await fetch('/api/keys', { headers: await this.authHeaders() });
    if (!res.ok) throw new Error('Failed to load API keys.');
    return res.json() as Promise<ApiKey[]>;
  }

  async create(name: string): Promise<CreatedApiKey> {
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: await this.authHeaders(),
      body: JSON.stringify({ name }),
    });
    const body = (await res.json().catch(() => ({}))) as CreatedApiKey & { message?: string };
    if (!res.ok) throw new Error(body.message ?? 'Failed to create API key.');
    return body;
  }

  async revoke(id: string): Promise<void> {
    const res = await fetch(`/api/keys/${id}`, {
      method: 'DELETE',
      headers: await this.authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to revoke API key.');
  }
}
