import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import Datastore, { Payment } from 'nedb';

import Robokassa from './robokassa';
import { PaymentRequest } from './robokassa.struct';

const transactionMgr = new Robokassa({
    login: process.env.ROBOKASSA_LOGIN,
    password1: process.env.ROBOKASSA_PASSWORD1,
    password2: process.env.ROBOKASSA_PASSWORD2,
    debug: true
});

const app = express();
const db = new Datastore({ filename: 'data.db', autoload: true });

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
    const payment: Payment = { id: invId, count: summ, status: -1, created: new Date() };
    console.log(`Запрос на получение ссылки на оплату на сумму ${summ}, для заказа ${invId}`);
    db.insert(payment, (err, _) => {
        if (err) {
            console.log('Ошибка при записи в базу данных');
            res.status(500).send({ error: `Error "${err}"` });
            return;
        }
        res.send({ paymentLink: link });
    });
});

app.post('/checkpayment', (req: Request, res: Response) => {
    // todo реализация
    const id = req.body.invId;
    if (!id) {
        return res.status(400).send('Invalid request: missing required fields');
    }
    db.find({ id: id }, (err, docs) => {
        if (err) {
            console.log(`Ошибка получения значение из db по id ${id}`);
            res.status(500).send({ error: `Error "${err}"` });
            return;
        }
        console.log(`Запрос на получение информации о платеже, для заказа ${id}`);
        const payments = docs.map((i) => ({
            invId: i.id,
            status: i.status < 0 ? 'does not confirm' : Boolean(i.status),
            created: i.created
        }));
        res.send({ "payments": payments });
    })
})

app.post('/payment/result', (req: Request, res: Response) => {
    if (!req.body) {
        res.sendStatus(400).send('Invalid request: missing body fields');
        console.log('Был получен пустой запрос от робокассы');
        return;
    }
    console.log(req.body);
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
    const updateStatus = { status: true }
    db.update({ _id: paymentRequest.InvId }, { $set: updateStatus }, {}, (err, _) => {
        if (err) {
            console.log('Ошибка при обновлении статуса платежа');
            res.status(500).send('Write error');
            return;
        }
        res.send(`OK${paymentRequest.InvId}`);
        console.log('Платеж прошел проверку контрольной суммы, для заказа',
            `${paymentRequest.InvId} на сумму ${paymentRequest.OutSum}`);
    })
});

app.listen(9777, () => {
    console.log('Сервер запущен на порту 9777');
});