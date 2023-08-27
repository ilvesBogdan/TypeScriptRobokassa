# Используем базовый образ Node.js
FROM node:latest

# Установка рабочей директории внутри контейнера
WORKDIR /app

# Копирование package.json и yarn.lock в контейнер
COPY package.json yarn.lock ./

# Установка зависимостей
RUN yarn install --production

# Установка TypeScript
RUN yarn add typescript

# Копирование всего остального кода в контейнер
COPY . .

# Компиляция TypeScript кода
RUN yarn build

# Указываем переменные окружения
ENV ROBOKASSA_LOGIN="my_login"
ENV ROBOKASSA_PASSWORD1="my_password1"
ENV ROBOKASSA_PASSWORD2="my_password2"

# Указываем порт, на котором будет работать приложение
EXPOSE 9777

# Запуск приложения
CMD ["node", "dist/index.js"]