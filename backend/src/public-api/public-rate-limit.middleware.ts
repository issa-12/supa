import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';

// Per-consumer rate limiter for the whole public API. Same in-memory sliding
// window as the auth-endpoint limiter, but keyed on the API key (so quota is
// per consumer, not per shared IP) and applied to every /public route. Falls
// back to the client IP when no key is present. Emits standard RateLimit-* +
// Retry-After headers and returns 429 RATE_LIMITED.
@Injectable()
export class PublicApiRateLimitMiddleware implements NestMiddleware {
  private readonly hits = new Map<string, number[]>();
  private readonly windowMs = 60_000; // 1 minute
  private readonly max = 60; // requests per window per consumer

  use(req: Request, res: Response, next: NextFunction): void {
    const apiKey =
      (req.headers['x-api-key'] as string) || extractBearer(req.headers['authorization'] as string | undefined);
    const subject = apiKey
      ? `key:${createHash('sha256').update(apiKey).digest('hex').slice(0, 16)}`
      : `ip:${(req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || 'unknown'}`;

    const now = Date.now();
    const recent = (this.hits.get(subject) ?? []).filter((t) => now - t < this.windowMs);

    res.setHeader('RateLimit-Limit', String(this.max));

    if (recent.length >= this.max) {
      const retryAfterSec = Math.ceil((this.windowMs - (now - recent[0])) / 1000);
      res.setHeader('RateLimit-Remaining', '0');
      res.setHeader('Retry-After', String(Math.max(1, retryAfterSec)));
      throw new HttpException(
        { code: 'RATE_LIMITED', message: 'Rate limit exceeded. Slow down and retry shortly.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recent.push(now);
    this.hits.set(subject, recent);
    res.setHeader('RateLimit-Remaining', String(this.max - recent.length));

    // Bound memory: entries are short-lived, so an occasional full clear is fine.
    if (this.hits.size > 10_000) this.hits.clear();

    next();
  }
}

function extractBearer(auth: string | undefined): string | null {
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}
