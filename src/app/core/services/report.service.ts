import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'inappropriate_content'
  | 'impersonation'
  | 'other';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly supabaseService = inject(SupabaseService);

  async reportUser(
    reportedUserId: string,
    reason: ReportReason,
    description?: string,
  ): Promise<{ id: number }> {
    const session = await this.supabaseService.getCurrentSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        reportedUserId,
        reason,
        description: description?.trim() || undefined,
      }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((payload as { message?: string }).message ?? 'Request failed.');
    }
    return payload as { id: number };
  }
}
