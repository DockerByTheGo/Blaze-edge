
import { password, type WebSocket } from "bun";
import { ur } from "zod/locales";
class WebsocketConnectionSingleTon {
    static ws: WebSocket | null = null;

    static get(url: string) {
        if (WebsocketConnectionSingleTon.ws === null) {
            WebsocketConnectionSingleTon.ws = new WebSocket(url)
            return WebsocketConnectionSingleTon.ws
        } else {
            return WebsocketConnectionSingleTon.ws
        }

    }
}


export const getWebsocketConnection = (url: string) => WebsocketConnectionSingleTon.get(url)