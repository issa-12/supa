import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Lightweight in-memory rate limiter (no external dependency — fine for the
// single-instance deployment). Throttles abusive bursts per client IP + path,
// closing the "unlimited OTP / signup spam" hole. Returns 429 RATE_LIMITED.
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly hits = new Map<string, number[]>();
  private readonly windowMs = 60_000; // 1 minute
  private readonly max = 8; // requests per window per IP+path

  use(req: Request, _res: Response, next: NextFunction): void {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.ip
      || req.socket?.remoteAddress
      || 'unknown';
    const key = `${ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();

    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.max) {
      throw new HttpException(
        { code: 'RATE_LIMITED', message: 'Too many requests. Please wait a minute and try again.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    recent.push(now);
    this.hits.set(key, recent);

    // Bound memory: drop everything occasionally (entries are short-lived).
    if (this.hits.size > 10_000) this.hits.clear();

    next();
  }
}
