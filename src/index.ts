import express, { Request, Response } from 'express';

import Robokassa from './robokassa';
import { PaymentRequest } from './interfaces';

const transactionMgr = new Robokassa({
    login: process.env.ROBOKASSA_LOGIN,
    password1: process.env.ROBOKASSA_PASSWORD1,
    password2: process.env.ROBOKASSA_PASSWORD2,
});

const app = express();

app.post('/getlink', (req: Request, res: Response) => {
    const { id, summ, description } = req.body;
    const link = transactionMgr.merchantUrl({ id, summ, description });
    res.send({ paymentLink: link });
});

app.post('/checkpayment', (req: Request, res: Response) => {
    // todo реализация
    console.log("Запрос на получение информации о платеже");
})

app.post('/payment/result', (req: Request, res: Response) => {
    const paymentRequest: PaymentRequest = req.params as PaymentRequest;
    if (transactionMgr.checkPayment(paymentRequest)) {
        // todo реализовать хранение записи об успешном платеже
        console.log("Ура!");
    } else {
        // todo реализовать хранение записи об неудачном платеже
        console.log("Не ура!");
    }
});

app.listen(9777, () => {
    console.log('Сервер запущен на порту 9777');
});