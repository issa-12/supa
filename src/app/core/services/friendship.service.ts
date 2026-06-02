import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface FriendUser {
  friendshipId: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  username: string | null;
  since: string;
}

export interface FriendRequest {
  friendshipId: number;
  requesterId: string;
  name: string;
  avatarUrl: string | null;
  username: string | null;
  requestedAt: string;
}

export type FriendshipStatusValue =
  | 'none'
  | 'pending_sent'
  | 'pending_received'
  | 'accepted'
  | 'rejected'
  | 'blocked';

export interface FriendshipStatus {
  status: FriendshipStatusValue;
  friendshipId: number | null;
  blockedByMe?: boolean;
}

@Injectable({ providedIn: 'root' })
export class FriendshipService {
  private readonly supabaseService = inject(SupabaseService);

  private async authHeaders(): Promise<Record<string, string>> {
    const session = await this.supabaseService.getCurrentSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not authenticated');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  private async apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.authHeaders();
    const res = await fetch(`/api/friends${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((payload as { message?: string }).message ?? 'Request failed.');
    return payload as T;
  }

  sendRequest(toUserId: string): Promise<{ friendshipId: number }> {
    return this.apiFetch('/request', {
      method: 'POST',
      body: JSON.stringify({ toUserId }),
    });
  }

  acceptRequest(friendshipId: number): Promise<{ success: boolean }> {
    return this.apiFetch(`/${friendshipId}/accept`, { method: 'PATCH' });
  }

  rejectRequest(friendshipId: number): Promise<{ success: boolean }> {
    return this.apiFetch(`/${friendshipId}/reject`, { method: 'PATCH' });
  }

  deleteFriendship(friendshipId: number): Promise<{ success: boolean }> {
    return this.apiFetch(`/${friendshipId}`, { method: 'DELETE' });
  }

  getFriends(): Promise<FriendUser[]> {
    return this.apiFetch<FriendUser[]>('');
  }

  getIncomingRequests(): Promise<FriendRequest[]> {
    return this.apiFetch<FriendRequest[]>('/requests');
  }

  getFriendshipStatus(otherUserId: string): Promise<FriendshipStatus> {
    return this.apiFetch<FriendshipStatus>(`/status/${otherUserId}`);
  }

  getFriendCount(userId: string): Promise<{ count: number }> {
    return this.apiFetch<{ count: number }>(`/count/${userId}`);
  }

  blockUser(userId: string): Promise<{ success: boolean }> {
    return this.apiFetch<{ success: boolean }>(`/block/${userId}`, { method: 'POST' });
  }

  unblockUser(userId: string): Promise<{ success: boolean }> {
    return this.apiFetch<{ success: boolean }>(`/block/${userId}`, { method: 'DELETE' });
  }
}
