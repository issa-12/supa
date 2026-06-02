import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

const ALLOWED_REASONS = new Set([
  'spam',
  'harassment',
  'inappropriate_content',
  'impersonation',
  'other',
]);

const MAX_DESCRIPTION_LENGTH = 500;

@Injectable()
export class ReportsService {
  constructor(private readonly supabase: SupabaseService) {}

  async verifyUser(token: string): Promise<string> {
    const { data, error } = await this.supabase.getAdmin().auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Invalid token.');
    return data.user.id;
  }

  async createReport(input: {
    reporterId: string;
    reportedId: string;
    reason: string;
    description?: string | null;
  }): Promise<{ id: number }> {
    const { reporterId, reportedId } = input;
    const reason = (input.reason || '').trim();
    const description = (input.description || '').trim() || null;

    if (!reportedId || !isUuid(reportedId)) {
      throw new BadRequestException('reportedUserId must be a valid UUID.');
    }
    if (reporterId === reportedId) {
      throw new ForbiddenException('Cannot report yourself.');
    }
    if (!ALLOWED_REASONS.has(reason)) {
      throw new BadRequestException(
        `reason must be one of: ${[...ALLOWED_REASONS].join(', ')}.`,
      );
    }
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      throw new BadRequestException(
        `description must be at most ${MAX_DESCRIPTION_LENGTH} characters.`,
      );
    }

    const admin = this.supabase.getAdmin();
    const { data, error } = await admin
      .from('user_reports')
      .insert({
        reporter_id: reporterId,
        reported_id: reportedId,
        reason,
        description,
      })
      .select('id')
      .single();

    if (error) {
      if ((error as { code?: string }).code === '23503') {
        throw new BadRequestException('Reported user does not exist.');
      }
      throw new InternalServerErrorException(error.message);
    }

    return { id: data['id'] as number };
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(value: string): boolean {
  return typeof value === 'string' && UUID_RE.test(value);
}
