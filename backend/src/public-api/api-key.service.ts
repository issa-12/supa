import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { SupabaseService } from '../supabase/supabase.service';
import { ApiKeyDto, CreatedApiKeyDto } from './dto/api-key.dto';

export interface ApiKeyConsumer {
  keyId: string;
  userId: string;
  scopes: string[];
}

// All keys carry this prefix so the auth path can reject obviously-wrong tokens
// before touching the database, and so users can recognise a ReadTrack key.
const KEY_PREFIX = 'rt_live_';

@Injectable()
export class ApiKeyService {
  constructor(private readonly supabase: SupabaseService) {}

  private hash(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  // Mint a new key for a user. The plaintext is returned exactly once here and
  // never stored — only its SHA-256 hash is persisted.
  async create(userId: string, name: string): Promise<CreatedApiKeyDto> {
    const fullKey = `${KEY_PREFIX}${randomBytes(32).toString('base64url')}`;
    const { data, error } = await this.supabase
      .getAdmin()
      .from('api_keys')
      .insert({
        user_id: userId,
        name,
        key_prefix: fullKey.slice(0, 12),
        key_hash: this.hash(fullKey),
        scopes: ['read', 'write'],
      })
      .select('id, name, key_prefix, scopes, created_at, last_used_at, revoked_at, expires_at')
      .single();
    if (error) throw error;
    return { ...this.toDto(data), key: fullKey };
  }

  async list(userId: string): Promise<ApiKeyDto[]> {
    const { data, error } = await this.supabase
      .getAdmin()
      .from('api_keys')
      .select('id, name, key_prefix, scopes, created_at, last_used_at, revoked_at, expires_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => this.toDto(r));
  }

  // Revoke is idempotent on ownership: only the owner's still-active key flips.
  async revoke(userId: string, keyId: string): Promise<{ revoked: true }> {
    const { data, error } = await this.supabase
      .getAdmin()
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', keyId)
      .eq('user_id', userId)
      .is('revoked_at', null)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('API key not found.');
    return { revoked: true };
  }

  // Resolve an incoming raw key to its owning consumer, or null when the key is
  // malformed / unknown / revoked / expired. Bumps last_used_at best-effort.
  async verify(rawKey: string | undefined | null): Promise<ApiKeyConsumer | null> {
    if (!rawKey || !rawKey.startsWith(KEY_PREFIX)) return null;

    const { data } = await this.supabase
      .getAdmin()
      .from('api_keys')
      .select('id, user_id, scopes, revoked_at, expires_at')
      .eq('key_hash', this.hash(rawKey))
      .maybeSingle();

    if (!data || data['revoked_at']) return null;
    const expiresAt = data['expires_at'] as string | null;
    if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return null;

    void this.supabase
      .getAdmin()
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data['id'])
      .then(
        () => undefined,
        () => undefined,
      );

    return {
      keyId: data['id'] as string,
      userId: data['user_id'] as string,
      scopes: (data['scopes'] as string[]) ?? [],
    };
  }

  private toDto(r: Record<string, unknown>): ApiKeyDto {
    return {
      id: r['id'] as string,
      name: r['name'] as string,
      keyPrefix: r['key_prefix'] as string,
      scopes: (r['scopes'] as string[]) ?? [],
      createdAt: r['created_at'] as string,
      lastUsedAt: (r['last_used_at'] as string) ?? null,
      revokedAt: (r['revoked_at'] as string) ?? null,
      expiresAt: (r['expires_at'] as string) ?? null,
    };
  }
}
