// multer configuration
import { Request } from "express";
import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: any) {
    cb(null, "./src/storage");
  },
  filename: function (req: Request, file: Express.Multer.File, cb: any) {
    console.log(file);
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

export { multer, storage };
