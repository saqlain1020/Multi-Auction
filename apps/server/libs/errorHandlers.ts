import { RequestHandler } from "express";

export const routerAsyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      const errObj = {
        body: req.body,
        // @ts-ignore
        rateLimit: req.rateLimit,
        query: req.query,
        params: req.params,
        baseUrl: req.baseUrl,
        method: req.method,
        headers: req.headers,
        cookies: req.cookies,
        time: new Date(),
      };
      console.log(errObj);
      console.log(err);
      res.status(500).json({
        status: false,
        error: err?.message,
      });
    });
  };
