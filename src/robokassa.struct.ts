interface PaymentRequest {
    [key: string]: string;
    InvId: string;
    OutSum: string;
    SignatureValue: string;
}

export { PaymentRequest };