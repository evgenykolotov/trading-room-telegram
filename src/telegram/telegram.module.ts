import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegramService } from './services/telegram.service';
import { TelegramBotService } from './services/telegram-bot.service';
import { TelegramClientProvider } from './providers/telegram-client.provider';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('TELEGRAM_BOT_TOKEN') ?? '',
      }),
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: configService.get<string>('REDIS_URL') ?? '',
        options: {
          password: configService.get<string>('REDIS_PASSWORD') ?? '',
        },
      }),
    }),
  ],
  providers: [TelegramClientProvider, TelegramService, TelegramBotService],
  exports: [TelegramService],
})
export class TelegramModule {}
