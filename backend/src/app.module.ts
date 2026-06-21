import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { RateLimitMiddleware } from './common/rate-limit.middleware';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { FriendsModule } from './friends/friends.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { StatsModule } from './stats/stats.module';
import { CommunityModule } from './community/community.module';
import { ReportsModule } from './reports/reports.module';
import { PublicApiModule } from './public-api/public-api.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [SupabaseModule, AuthModule, BooksModule, FriendsModule, NotificationsModule, RecommendationsModule, StatsModule, CommunityModule, ReportsModule, PublicApiModule],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Throttle the abuse-prone auth endpoints (OTP send / signup / verify).
    consumer.apply(RateLimitMiddleware).forRoutes(
      { path: 'auth/request-signup', method: RequestMethod.POST },
      { path: 'auth/resend-verification', method: RequestMethod.POST },
      { path: 'auth/verify-email', method: RequestMethod.POST },
    );
  }
}
