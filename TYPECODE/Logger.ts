export class Logger {
    public static info(message: string){
        parent.caracAL.log.info({ type: "log", col: "blue" }, message,);
    }

    public static warn(message: string) {
        parent.caracAL.log.warn({ type: "log", col: "red" }, message,);
    }

    public static error(message: string) {
        parent.caracAL.log.error({ type: "log", col: "yellow" }, message,);
    }

    public static debug(message: string) {
        parent.caracAL.log.error({ type: "log", col: "yellow" }, message,);
    }
}