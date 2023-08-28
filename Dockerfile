FROM node:latest
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --production
RUN yarn add typescript
COPY . .
RUN yarn build

# Аргументы пользовательского ввода
ARG Login
ARG Pass1
ARG Pass2
# Указываем переменные окружения
ENV ROBOKASSA_LOGIN=$Login
ENV ROBOKASSA_PASSWORD1=$Pass1
ENV ROBOKASSA_PASSWORD2=$Pass2

EXPOSE 9777
CMD ["node", "dist/index.js"]