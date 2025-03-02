import {
  Logger,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { TelegramClient } from 'telegram';
import { ConfigService } from '@nestjs/config';
import { StringSession } from 'telegram/sessions';

@Injectable()
export class TelegramClientProvider implements OnModuleInit, OnModuleDestroy {
  private client: TelegramClient;
  private readonly logger = new Logger(TelegramClientProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.client = new TelegramClient(
      new StringSession(this.configService.get('TELEGRAM_SESSION')),
      parseInt(this.configService.get('TELEGRAM_API_ID') ?? '', 10),
      this.configService.get('TELEGRAM_API_ID') ?? '',
      {
        connectionRetries: 5,
      },
    );
    this.logger.log('🟡 Подключение к Telegram...');
    await this.client.connect();
    this.logger.log('✅ TelegramClient успешно подключен 🚀');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      this.logger.warn('🔴 Отключение TelegramClient...');
      await this.client.disconnect();
      this.logger.log('❌ TelegramClient отключен');
    }
  }

  getClient(): TelegramClient {
    return this.client;
  }
}
