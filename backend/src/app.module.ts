import { Module } from '@nestjs/common';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { FriendsModule } from './friends/friends.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [SupabaseModule, AuthModule, BooksModule, FriendsModule, NotificationsModule],
})
export class AppModule {}
