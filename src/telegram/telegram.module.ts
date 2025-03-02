import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegramService } from './services/telegram.service';
import { TelegramBotService } from './services/telegram-bot.service';
import { TelegramClientProvider } from './providers/telegram-client.provider';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('TELEGRAM_BOT_TOKEN') ?? '',
      }),
    }),
  ],
  providers: [TelegramClientProvider, TelegramService, TelegramBotService],
  exports: [TelegramService],
})
export class TelegramModule {}
