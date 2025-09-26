import { NextFunction, Request, Response } from "express";

class ErrorHandlerService {
  static asyncErrorHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      fn(req, res, next).catch((err: Error) => {
        console.log(err, "Error");
        return res.status(500).json({
          message: err.message,
          fullError: err,
        });
      });
    };
  }
}

export default ErrorHandlerService;
