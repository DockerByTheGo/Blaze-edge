
class WebsocketConnectionSingleTon {
    static ws: WebSocket | null;

    static get(){
        if(WebsocketConnectionSingleTon.ws === null) {
            WebsocketConnectionSingleTon.ws =  null
        }else{
            return WebsocketConnectionSingleTon.ws
        }
        
    }
}


export const getWebsocketConnection =  WebsocketConnectionSingleTon.get