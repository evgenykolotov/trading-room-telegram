import { Api } from 'telegram';
import { Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { ConfigService } from '@nestjs/config';
import { MessageEntity } from 'telegraf/types';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TelegramClientProvider } from './telegram-client.provider';

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
    @InjectBot() private bot: Telegraf,
    private readonly configService: ConfigService,
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
          if (message.photo && message.text) {
            const hashtags = this.extractHashtagsFromEntities(message);

            if (
              message.text.toUpperCase().includes('КАЛЕНДАРЬ НА СЕГОДНЯ') ||
              hashtags.includes('календарь')
            ) {
              await this.sendPhotoToChannel(+TRADING_ROOM_GROUP_ID, message);
              return;
            }

            if (
              (event.message.text.includes('🇷🇺') ||
                hashtags.includes('россия')) &&
              this.RUSSIA_HASH_TAGS.some((tag) => hashtags.includes(tag))
            ) {
              await this.sendPhotoToChannel(+TRADING_ROOM_GROUP_ID, message);
              return;
            }

            if (hashtags.includes('геополитика')) {
              await this.sendPhotoToChannel(+TRADING_ROOM_GROUP_ID, message);
              return;
            }
          }

          if (message.text) {
            const hashtags = this.extractHashtagsFromEntities(message);

            if (
              message.text.toUpperCase().includes('КАЛЕНДАРЬ НА СЕГОДНЯ') ||
              hashtags.includes('календарь')
            ) {
              await this.sendMessageToChannel(+TRADING_ROOM_GROUP_ID, message);
              return;
            }

            if (
              (event.message.text.includes('🇷🇺') ||
                hashtags.includes('россия')) &&
              this.RUSSIA_HASH_TAGS.some((tag) => hashtags.includes(tag))
            ) {
              await this.sendMessageToChannel(+TRADING_ROOM_GROUP_ID, message);
              return;
            }

            if (hashtags.includes('геополитика')) {
              await this.sendMessageToChannel(+TRADING_ROOM_GROUP_ID, message);
              return;
            }
          }
        })();
      },
      new NewMessage({ chats: [MARKET_TWITS_CHANNEL_ID] }),
    );

    this.logger.log('Listening for new messages...');
  }

  private async sendMessageToChannel(
    channelId: number,
    message: Api.Message,
  ): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(
        channelId,
        removeMarkdown(message.text),
        {
          disable_notification: true,
          link_preview_options: { is_disabled: true },
          entities: convertEntities(message.entities ?? []),
        },
      );
      this.logger.log(`Сообщение отправлено в канал ${channelId}`);
    } catch (error: unknown) {
      this.logger.error(
        `Ошибка при отправке текстового сообщения в канал ${channelId}`,
        error,
      );
    }
  }

  private async sendPhotoToChannel(
    channelId: number,
    message: Api.Message,
  ): Promise<void> {
    try {
      const media = await message.downloadMedia();
      if (media instanceof Buffer) {
        await this.bot.telegram.sendPhoto(
          channelId,
          { source: media },
          {
            caption: removeMarkdown(message.text),
            caption_entities: convertEntities(message.entities ?? []),
          },
        );
      }
    } catch (error: unknown) {
      this.logger.error(
        `Ошибка при отправке сообщения c фото в канал ${channelId}`,
        error,
      );
    }
  }

  private extractHashtagsFromEntities(message: Api.Message): string[] {
    const hashtags: string[] = [];

    if (message.entities) {
      for (const entity of message.entities) {
        if (entity instanceof Api.MessageEntityHashtag) {
          // Извлекаем текст хэштега
          const hashtagText = message.text.substring(
            entity.offset,
            entity.offset + entity.length,
          );
          hashtags.push(hashtagText.slice(1)); // Убираем символ #
        }
      }
    }

    return hashtags;
  }
}

function convertEntities(entities: Api.TypeMessageEntity[]): MessageEntity[] {
  return entities
    .map((entity) => {
      const baseEntity = {
        offset: entity.offset,
        length: entity.length,
      };

      if (entity instanceof Api.MessageEntityHashtag) {
        return { ...baseEntity, type: 'hashtag' };
      }

      if (entity instanceof Api.MessageEntityBold) {
        return { ...baseEntity, type: 'bold' };
      }

      if (entity instanceof Api.MessageEntityItalic) {
        return { ...baseEntity, type: 'italic' };
      }

      if (entity instanceof Api.MessageEntityUrl) {
        return { ...baseEntity, type: 'url' };
      }

      if (entity instanceof Api.MessageEntityTextUrl) {
        return { ...baseEntity, type: 'text_link', url: entity.url };
      }

      if (entity instanceof Api.MessageEntityMention) {
        return { ...baseEntity, type: 'mention' };
      }

      if (entity instanceof Api.MessageEntityCode) {
        return { ...baseEntity, type: 'code' };
      }

      if (entity instanceof Api.MessageEntityPre) {
        return { ...baseEntity, type: 'pre' };
      }

      if (entity instanceof Api.MessageEntityMentionName) {
        return {
          ...baseEntity,
          type: 'text_mention',
          user: { id: entity.userId },
        };
      }

      if (entity instanceof Api.MessageEntityUnderline) {
        return { ...baseEntity, type: 'underline' };
      }

      if (entity instanceof Api.MessageEntityStrike) {
        return { ...baseEntity, type: 'strikethrough' };
      }

      if (entity instanceof Api.MessageEntitySpoiler) {
        return { ...baseEntity, type: 'spoiler' };
      }

      if (entity instanceof Api.MessageEntityCustomEmoji) {
        return {
          ...baseEntity,
          type: 'custom_emoji',
          custom_emoji_id: entity.documentId.toString(),
        };
      }

      if (entity instanceof Api.MessageEntityBlockquote) {
        return { ...baseEntity, type: 'blockquote' };
      }

      if (entity instanceof Api.MessageEntityBankCard) {
        return { ...baseEntity, type: 'bank_card' };
      }

      if (entity instanceof Api.MessageEntityPhone) {
        return { ...baseEntity, type: 'phone' };
      }

      if (entity instanceof Api.MessageEntityCashtag) {
        return { ...baseEntity, type: 'cashtag' };
      }

      return null; // Игнорируем неизвестные сущности
    })
    .filter((entity) => entity !== null) as MessageEntity[];
}

function removeMarkdown(text: string): string {
  // Удаляем Markdown-разметку
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Жирный текст: **текст**
    .replace(/\*(.*?)\*/g, '$1') // Курсив: *текст*
    .replace(/__(.*?)__/g, '$1') // Подчеркивание: __текст__
    .replace(/~~(.*?)~~/g, '$1') // Зачеркивание: ~~текст~~
    .replace(/`(.*?)`/g, '$1') // Код: `текст`
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // Ссылки: [текст](url)
    .replace(/\n>/g, '\n') // Цитаты: > текст
    .replace(/!\[(.*?)\]\((.*?)\)/g, '$1'); // Изображения: ![alt](url)
}
