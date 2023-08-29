declare module 'nedb' {
    interface Payment {
        id: number
        count: number;
        status: number;
        created: Date;
    }

    interface DatastoreOptions {
        filename: string;
        autoload: boolean;
    }

    class Datastore {
        constructor(options: DatastoreOptions);
        insert(doc: Payment, callback: (err: Error, newDoc: Payment) => void): void;
        find(query: any, callback: (err: Error, docs: Payment[]) => void): void;
        update(query: any, update: any, options: any, callback: (err: Error, numReplaced: number) => void): void;
        remove(query: any, options: any, callback: (err: Error, numRemoved: number) => void): void;
    }

    export { Payment };
    export default Datastore;
}