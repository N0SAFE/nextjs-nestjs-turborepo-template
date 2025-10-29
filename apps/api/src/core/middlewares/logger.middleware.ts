import { Injectable, Logger, type NestMiddleware } from "@nestjs/common";
import type { Request, Response } from "express";
import type * as os from "os";
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private readonly logger = new Logger(LoggerMiddleware.name);
    use(req: Request, res: Response, next: () => void): void {
        const { ip, method, originalUrl: url } = req;
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const hostname = (require("os") as typeof os).hostname();
        const userAgent = req.get("user-agent") ?? "";
        const referer = req.get("referer") ?? "";
        res.on("close", () => {
            const { statusCode, statusMessage } = res;
            const contentLength = res.get("content-length");
            // Enhanced debug logging with structured data
            this.logger.debug(`[${hostname}] "${method} ${url}" ${String(statusCode)} ${statusMessage} ${String(contentLength)} "${referer}" "${userAgent}" "${String(ip)}"`);
            console.log("response: ", res.statusCode, res.statusMessage, contentLength, referer, userAgent, ip);
            res.end();
        });
        next();
    }
}
