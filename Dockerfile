# Используем базовый образ Node.js
FROM node:latest

# Установка рабочей директории внутри контейнера
WORKDIR /app

# Копирование package.json и yarn.lock в контейнер
COPY package.json yarn.lock ./

# Установка зависимостей
RUN yarn install --production

# Копирование всего остального кода в контейнер
COPY . .

# Компиляция TypeScript кода
RUN yarn build

# Указываем порт, на котором будет работать приложение
EXPOSE 9777

# Запуск приложения
CMD ["node", "dist/index.js"]