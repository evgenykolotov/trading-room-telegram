import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramClientProvider } from './telegram-client.provider';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
  providers: [TelegramClientProvider, TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
