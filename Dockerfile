FROM node:latest
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --production
RUN yarn add typescript
COPY . .
RUN yarn build

# установите переменные окружения
ENV ROBOKASSA_LOGIN=
ENV ROBOKASSA_PASSWORD1=
ENV ROBOKASSA_PASSWORD2=

RUN if [ -z "$Login" ]; then echo "Укажите логин" && exit 1; fi
RUN if [ -z "$Pass1" ]; then echo "Укажите пароль1" && exit 1; fi
RUN if [ -z "$Pass2" ]; then echo "Укажите пароль2" && exit 1; fi
EXPOSE 9777
CMD ["node", "dist/index.js"]