//yadi hume different type/format ka data lene hota h user se jaise ki text, image ya kisi bhi type ki file toh hum ushe directly json format me nhi le skte, hume ushe form format me lena hoga aur us form format k data ko access krne k liye hume multer middleware ki jrurt pdti h. Iski help se hum us file ko local storage/RAM (jo ki by default hoti h) ya fir disk storage me store krva skte h.

import multer from 'multer';
import {v4 as uuid} from 'uuid'


//laptop ki disk ki memory ko use krge photo ko save krne k liye
// const storage = multer.diskStorage({

//     //koi bhi product ki photo upload hogi vo uploads folder me jaiye gi
//     destination(req, file, callback){
//         callback(null, "uploads");
//     },

//     filename(req, file, callback){
//         // file ka jo naam aaye ga vo original naam aaye ga
//         //lekin hume original naam se save nhi krni h kyoki yadi koi ek product ko delete kre ga toh sbhi product delete ho jaiye ge isliye hum uuid extension use krege

//        // callback(null, file.originalname);

//        //ye 1 random id generate kr dega us photo ke liye jo user upload krega
//         const id = uuid();

//         //hum photo k original naam me se extension le lege
//         const extName = file.originalname.split(".").pop();
//         //yadi koi image ka naam mac.book.png rkh deta h toh split method use mac,bbok,png me split krdega aur pop() method last vala element(png) extName me return krdega

//         //jo id humne uuid package ki help se generate kri h vo id aur jo extension name original name se derive kiya h vo dono combine ho kr 1 string ban jaiye gi aur fileName variable me store ho jaiye gi
//         const fileName = `${id}.${extName}`;

//         //ye uploads folder me filename ki 1 file bna dega
//         callback(null,fileName);
//     }
// });

//is middleware ko hum product k route me use krege jha hum product create krte time uski image upload kr rhe h.

//jo name hum single("photo") isme dege ushi name se hum us file ho le skte h. is case me file ka name photo h
// export const singleUpload = multer({storage}).single("photo");
// export const upload = multer({ storage });
export const multiUpload = (count: number) => multer().array("photos", count);