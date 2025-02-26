# Используем базовый образ Node.js 22.10 на Alpine Linux
FROM node:22.10-alpine
# Установка рабочего каталога в контейнере
WORKDIR /app
# Копируем package.json и package-lock.json
COPY package*.json ./
# Устанавливаем все зависимости, включая devDependencies
RUN npm ci --legacy-peer-deps
# Копируем весь исходный код
COPY . .
# Сборка проекта Nest.js
RUN npm run build
# Открываем порт для приложения
EXPOSE 3000
# Команда запуска приложения
CMD ["npm", "run", "start:prod"]