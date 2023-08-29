# Type Script Robokassa

Type Script Robokassa - это микросервис на TypeScript для работы с сервисом принятия платежей "Робокасса".

## Описание

Данный проект предоставляет пример реализации микросервиса на TypeScript, который взаимодействует с сервисом "Robokassa" для обработки платежей. Он разработан с использованием пакетного менеджера Yarn и будет работать внутри Docker контейнера.

## Установка и запуск

1. Клонирование репозитория
2. Установите ROBOKASSA_LOGIN, ROBOKASSA_PASSWORD1 и ROBOKASSA_PASSWORD2 в Dockerfile
3. Создайте docker образ `docker build -t robokassa .`
4. Запустите контейнер `docker run -d -p 9777:9777 robokassa`
5. Прокинте запрос "Result" post метод от Робокассы на http://localhost:9777/payment/result

## Как использовать

Вы можете использовать данный проект в качестве основы для разработки своего микросервиса на TypeScript, который будет взаимодействовать с сервисом "Робокасса". Используйте файл `index.ts` в качестве точки входа для вашей логики обработки платежей. Дополнительно, вы можете настроить параметры и конфигурацию "Робокассы" в соответствующих файлах.