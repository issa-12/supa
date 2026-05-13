import { Injectable, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://qgoermeodyyfrfoyvnvo.supabase.co';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private adminClient: SupabaseClient;
  private anonClient: SupabaseClient;

  onModuleInit() {
    const url = process.env['SUPABASE_URL'] ?? DEFAULT_SUPABASE_URL;
    const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    const anonKey = process.env['SUPABASE_ANON_KEY'];

    if (!serviceRoleKey) {
      throw new ServiceUnavailableException(
        'Auth is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env and restart.',
      );
    }
    if (!anonKey) {
      throw new ServiceUnavailableException(
        'Auth is not configured. Add SUPABASE_ANON_KEY to .env and restart.',
      );
    }

    this.adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    this.anonClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  getAdmin(): SupabaseClient {
    return this.adminClient;
  }

  getAnon(): SupabaseClient {
    return this.anonClient;
  }
}
