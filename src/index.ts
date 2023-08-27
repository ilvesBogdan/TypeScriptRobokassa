import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';

import Robokassa from './robokassa';
import { PaymentRequest } from './interfaces';


const transactionMgr = new Robokassa({
    login: process.env.ROBOKASSA_LOGIN,
    password1: process.env.ROBOKASSA_PASSWORD1,
    password2: process.env.ROBOKASSA_PASSWORD2,
});

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/getlink', (req: Request, res: Response) => {
    if (!req.body) {
        console.log(req.body);
        return res.sendStatus(400).send('Invalid request: missing body fields');
    }
    const { id, summ, description } = req.body;
    if (!id || !summ || !description) {
        return res.status(400).send('Invalid request: missing required fields');
    }
    const link = transactionMgr.merchantUrl({ id, summ, description });
    res.send({ paymentLink: link });
});

app.post('/checkpayment', (req: Request, res: Response) => {
    // todo реализация
    const id = req.body.id;
    if (!id) {
        return res.status(400).send('Invalid request: missing required fields');
    }
    res.send({ "reply": id });
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
    console.log('link ===>', req.url);
    console.log('body ===>', req.body);
});

app.listen(9777, () => {
    console.log('Сервер запущен на порту 9777');
});