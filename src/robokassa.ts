import crypto from 'crypto';

import { ErrMissingParam, ErrInvalidHash, ErrInvalidParam } from './errors';
import { PaymentRequest } from './robokassa.struct';

export default class Robokassa {
    private login: string;
    private pass1: string;
    private pass2: string;
    private hashType: string;
    private url: string;
    private paramPrefix: string;
    private debug: boolean;

    constructor(opts: {
        login: string | undefined;
        password1: string | undefined;
        password2: string | undefined;
        hash?: string;
        url?: string;
        paramPrefix?: string;
        debug?: boolean;
    }) {
        if (opts.login === undefined)
            throw new ErrInvalidParam('Отсутствует обязательный параметр login');
        if (opts.password1 === undefined)
            throw new ErrInvalidParam('Отсутствует обязательный параметр password1');
        if (opts.password2 === undefined)
            throw new ErrInvalidParam('Отсутствует обязательный параметр password2');

        this.login = opts.login;
        this.pass1 = opts.password1;
        this.pass2 = opts.password2;
        this.hashType = opts.hash || 'md5';
        this.url = opts.url || 'https://auth.robokassa.ru/Merchant/Index.aspx';
        this.paramPrefix = opts.paramPrefix || '_';
        this.debug = opts.debug || false;
    }

    /**
     * Генерирует URL для оплаты заказа.
     * 
     * @param order - Объект заказа.
     * @param order.id - Идентификатор заказа.
     * @param order.description - Описание заказа.
     * @param order.summ - Сумма заказа.
     * @param order.currency - Валюта заказа.
     * @param order.lang - Язык заказа.
     * @returns Сгенерированный URL для оплаты заказа.
     * @throws ErrMissingParam - Если не указан обязательный параметр.
     */
    public merchantUrl(order: {
        invId: number;
        summ: number;
        description?: string;
        currency?: string;
        lang?: string;
    }): string {
        if (order.summ < 1)
            throw new ErrInvalidParam('Недопустимая сумма заказа');
        const userParams = this.extractUserParams(order, this.paramPrefix);
        const cryptoOptions = [this.login, order.summ, order.invId];
        const query: Record<string, any> = {
            MerchantLogin: this.login,
            OutSum: order.summ,
            InvId: order.invId,
            ...(order.description ? { Desc: order.description } : {}),
            ...(this.debug ? { IsTest: 1 } : {})
        };

        if (order.currency) {
            cryptoOptions.push(order.currency);
            query.OutSumCurrency = order.currency;
        }

        if (order.lang) query.Culture = order.lang;

        cryptoOptions.push(this.pass1);

        if (userParams.length > 0) {
            for (let i = 0; i < userParams.length; i++) {
                const key = userParams[i];
                const val = order[key as keyof typeof order];
                if (val === undefined)
                    throw new ErrMissingParam(`Ненайден параметр ${key}`);
                cryptoOptions.push(`shp${key}=${val}`);
                query[`shp${key}`] = val;
            }
        }
        const signatureString = cryptoOptions.join(':');
        query.SignatureValue = this.hash(signatureString);
        return `${this.url}?${this.generateQueryString(query)}`;
    }

    /**
    * Проверяет платеж.
    *
    * @param req - Объект с данными платежа.
    * @param userFirstPass - Флаг, указывающий, является ли пользователь первым проходом.
    * @returns Возвращает true, если платеж прошел успешно, и false в противном случае.
    */
    public checkPayment(req: PaymentRequest, userFirstPass?: boolean): boolean {
        const fieldName = 'SignatureValue';
        if (!(fieldName in req && typeof req[fieldName] === 'string'))
            throw new ErrInvalidHash(fieldName in req ?
                'Неверный формат хэша'
                : `Отсутствует обязательный параметр ${fieldName}`);
        const keys = Object.keys(req).sort();
        const userParams: string[] = [];

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const val = req[key];
            userParams.push(`${key}=${val}`);
            delete req[key];
        }

        const crcOpts = [req.OutSum, req.InvId, userFirstPass ? this.pass1 : this.pass2];

        if (userParams.length > 0) {
            for (let i = 0; i < userParams.length; i++) {
                if (i !== undefined)
                    crcOpts.push(userParams[i]);
            }
        }

        const reqSig = req.SignatureValue;
        if (typeof reqSig !== 'string')
            throw new ErrInvalidHash('Неверный формат хэша');
        const crc = this.hash(crcOpts.join(':'));
        return crc === reqSig.toLowerCase();
    }

    /**
     * Извлекает параметры пользователя из объекта по заданному префиксу.
     * 
     * @param obj - Объект, из которого нужно извлечь параметры.
     * @param prefix - Префикс, по которому нужно извлекать параметры.
     * @returns Массив извлеченных параметров пользователя.
     */
    private extractUserParams(obj: Record<string, any>, prefix: string): string[] {
        const result: string[] = [];
        const keys = Object.keys(obj);

        for (const key of keys) {
            if (key.substring(0, prefix.length) === prefix) {
                result.push(key.substring(prefix.length));
            }
        }

        return result;
    }

    /**
     * Генерирует строку запроса на основе переданного объекта.
     * @param obj - Объект, содержащий пары ключ-значение для генерации строки запроса.
     * @returns Сгенерированная строка запроса.
     */
    private generateQueryString(obj: Record<string, any>): string {
        const queryString: string[] = [];

        for (const [key, value] of Object.entries(obj)) {
            if (key === '') continue;
            queryString.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        }

        queryString.push('Encoding=utf-8');

        return queryString.join('&');
    }

    /**
     * Хэширует переданные данные с использованием указанного алгоритма хеширования.
     * Если тип алгоритма не указан, используется алгоритм "sha1".
     * 
     * @param data - Данные для хеширования.
     * @param type - Тип алгоритма хеширования.
     * @returns Хэш-строка.
     */
    private hash(data: string): string {
        return crypto.createHash(this.hashType)
            .update(data)
            .digest('hex');
    }
}