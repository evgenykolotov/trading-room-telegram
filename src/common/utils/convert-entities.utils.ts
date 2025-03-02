import { Api } from 'telegram';
import { MessageEntity } from 'telegraf/types';

export const convertEntities = (
  entities: Api.TypeMessageEntity[],
): MessageEntity[] => {
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
};
