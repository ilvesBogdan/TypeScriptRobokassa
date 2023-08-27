import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';

import Robokassa from './robokassa';
import { PaymentRequest } from './interfaces';

const transactionMgr = new Robokassa({
    login: process.env.ROBOKASSA_LOGIN,
    password1: process.env.ROBOKASSA_PASSWORD1,
    password2: process.env.ROBOKASSA_PASSWORD2,
    debug: true
});

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/getlink', (req: Request, res: Response) => {
    if (!req.body) {
        console.log(req.body);
        return res.sendStatus(400).send('Invalid request: missing body fields');
    }
    const { invId, summ, description } = req.body;
    if (invId === undefined || summ === undefined) {
        return res.status(400).send('Invalid request: missing required fields');
    }
    const link = transactionMgr.merchantUrl({ invId, summ, description });
    res.send({ paymentLink: link });
    console.log(`Запрос на получение ссылки на оплату на сумму ${summ}, для заказа ${invId}`);
});

app.post('/checkpayment', (req: Request, res: Response) => {
    // todo реализация
    const id = req.body.id;
    if (!id) {
        return res.status(400).send('Invalid request: missing required fields');
    }
    res.send({ "reply": id });
    console.log(`Запрос на получение информации о платеже, для заказа ${id}`);
})

app.post('/payment/result', (req: Request, res: Response) => {
    if (!req.body) {
        res.sendStatus(400).send('Invalid request: missing body fields');
        console.log('Был получен пустой запрос от робокассы');
        return;
    }
    const paymentRequest: PaymentRequest = req.body as PaymentRequest;
    if (paymentRequest.InvId === undefined || paymentRequest.OutSum === undefined) {
        res.sendStatus(400).send('Invalid request: missing required fields');
        console.log('Был получен пустой запрос от робокассы');
        return;
    }
    if (!transactionMgr.checkPayment(paymentRequest)) {
        res.status(400).send('Hash incorrect');
        console.log('Платеж не прошел проверку контрольной суммы');
        return;
    }
    res.send(`OK${paymentRequest.InvId}`);
    // todo реализация записи в базу данных
    console.log('Платеж прошел проверку контрольной суммы, для заказа',
        `${paymentRequest.InvId} на сумму ${paymentRequest.OutSum}`);
});

app.listen(9777, () => {
    console.log('Сервер запущен на порту 9777');
});