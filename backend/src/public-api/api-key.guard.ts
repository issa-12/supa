import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyService, ApiKeyConsumer } from './api-key.service';

export interface AuthedRequest extends Request {
  apiConsumer?: ApiKeyConsumer;
}

// Authenticates public-API requests with a consumer API key, supplied either as
// `X-API-Key: rt_live_…` or `Authorization: Bearer rt_live_…`. On success the
// resolved consumer (owning user + scopes) is attached to the request.
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeys: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const raw = req.header('x-api-key') || extractBearer(req.header('authorization'));
    const consumer = await this.apiKeys.verify(raw);
    if (!consumer) {
      throw new UnauthorizedException('Invalid or missing API key. Provide it via the X-API-Key header.');
    }
    req.apiConsumer = consumer;
    return true;
  }
}

function extractBearer(auth: string | undefined): string | null {
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}
