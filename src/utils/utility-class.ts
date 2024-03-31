//ye file humne error ko handle krne k liye bnayi h.
//jha pr bhi hume message aur status code dena hoga toh hum baar baar itni line ka code nhi likhna hoga hum directly is class ko call kr lege

class ErrorHandler extends Error{
    constructor(public message: string,public statusCode: number){
        super(message);
        this.statusCode = statusCode;
    }
}

export default ErrorHandler;