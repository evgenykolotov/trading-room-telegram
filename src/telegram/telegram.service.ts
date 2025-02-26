import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TelegramClientProvider } from './telegram-client.provider';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    @InjectBot() private bot: Telegraf,
    private readonly configService: ConfigService,
    private readonly telegramClientProvider: TelegramClientProvider,
  ) {}

  onModuleInit(): void {
    const client = this.telegramClientProvider.getClient();

    const MARKET_TWITS_CHANNEL_ID: string = this.configService.get(
      'MARKET_TWITS_CHANNEL_ID',
    ) as string;

    client.addEventHandler(
      (event: NewMessageEvent) => {
        void (async () => {
          const message = event.message;

          if (message.text.toUpperCase().includes('КАЛЕНДАРЬ НА СЕГОДНЯ')) {
            await this.sendMessageToChannel(
              -1002335428555,
              event.message.chatId!.toString(),
              event.message.id,
            );
          }
        })();
      },
      new NewMessage({
        chats: [MARKET_TWITS_CHANNEL_ID],
      }),
    );

    this.logger.log('Listening for new messages...');
  }

  async sendMessageToChannel(
    channelId: number,
    chatId: string,
    messageId: number,
  ): Promise<void> {
    try {
      await this.bot.telegram.copyMessage(channelId, chatId, messageId);
      this.logger.log(`Сообщение отправлено в канал ${channelId}`);
    } catch (error) {
      this.logger.error(
        `Ошибка при отправке сообщения в канал ${channelId}`,
        error,
      );
    }
  }
}
