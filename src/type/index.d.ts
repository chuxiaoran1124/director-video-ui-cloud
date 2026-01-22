export {}
declare global {
    interface IResponse<T = any> {
        code: number;
        message: string;
        data: T;
    }
    interface IObject<T> {
        [index: string]: T
    }
    
    interface ITable<T = any> {
        data : Array<T>
        total: number
        page: number
        size: number
    }
    interface ImportMetaEnv {
        VITE_APP_TITLE: string
        VITE_PORT: number;
        VITE_PROXY: string;
    }
}