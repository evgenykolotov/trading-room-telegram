import { Api } from 'telegram';
import { ConfigService } from '@nestjs/config';
import { TelegramBotService } from './telegram-bot.service';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TelegramClientProvider } from '../providers/telegram-client.provider';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private readonly RUSSIA_HASH_TAGS = [
    'fx',
    'дкп',
    'CBDC',
    'RUB',
    'сша',
    'акции',
    'банки',
    'нефть',
    'макро',
    'торги',
    'нфлоги',
    'спикеры',
    'соцсети',
    'санкции',
    'прогноз',
    'инфляция',
    'отчетности',
    'отчетность',
    'геополитика',
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly telegramBotService: TelegramBotService,
    private readonly telegramClientProvider: TelegramClientProvider,
  ) {}

  onModuleInit(): void {
    const client = this.telegramClientProvider.getClient();

    const MARKET_TWITS_CHANNEL_ID: string = this.configService.get(
      'MARKET_TWITS_CHANNEL_ID',
    ) as string;

    const TRADING_ROOM_GROUP_ID: string = this.configService.get(
      'TRADING_ROOM_GROUP_ID',
    ) as string;

    client.addEventHandler(
      (event: NewMessageEvent) => {
        void (async () => {
          const message = event.message;
          const hashtags = this.extractHashtagsFromEntities(message);

          if (hashtags.length) {
            if (
              message.text.toUpperCase().includes('КАЛЕНДАРЬ НА СЕГОДНЯ') ||
              hashtags.includes('календарь')
            ) {
              return this.telegramBotService.sendMessageToChannel(
                +TRADING_ROOM_GROUP_ID,
                message,
              );
            }

            if (
              (event.message.text.includes('🇷🇺') ||
                hashtags.includes('россия')) &&
              this.RUSSIA_HASH_TAGS.some((tag) => hashtags.includes(tag))
            ) {
              return this.telegramBotService.sendMessageToChannel(
                +TRADING_ROOM_GROUP_ID,
                message,
              );
            }

            if (hashtags.includes('геополитика')) {
              return this.telegramBotService.sendMessageToChannel(
                +TRADING_ROOM_GROUP_ID,
                message,
              );
            }
          }
        })();
      },
      new NewMessage({ chats: [MARKET_TWITS_CHANNEL_ID] }),
    );

    this.logger.log('Listening for new messages...');
  }

  private extractHashtagsFromEntities(message: Api.Message): string[] {
    const hashtags: string[] = [];

    if (message.entities) {
      for (const entity of message.entities) {
        if (entity instanceof Api.MessageEntityHashtag) {
          const hashtagText = message.text.substring(
            entity.offset,
            entity.offset + entity.length,
          );
          hashtags.push(hashtagText.slice(1));
        }
      }
    }

    return hashtags;
  }
}
