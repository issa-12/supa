import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { BooksModule } from '../books/books.module';
import { ApiKeyService } from './api-key.service';
import { ApiKeyGuard } from './api-key.guard';
import { ApiKeysController } from './api-keys.controller';
import { PublicShelfController } from './public-shelf.controller';
import { PublicShelfService } from './public-shelf.service';
import { PublicApiRateLimitMiddleware } from './public-rate-limit.middleware';

@Module({
  imports: [SupabaseModule, BooksModule],
  controllers: [ApiKeysController, PublicShelfController],
  providers: [ApiKeyService, ApiKeyGuard, PublicShelfService],
})
export class PublicApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Per-consumer rate limit across the public API surface (all shelf routes).
    consumer.apply(PublicApiRateLimitMiddleware).forRoutes(PublicShelfController);
  }
}
