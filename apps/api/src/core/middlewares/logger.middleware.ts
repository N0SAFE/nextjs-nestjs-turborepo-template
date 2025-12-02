import { Injectable, Logger, type NestMiddleware } from "@nestjs/common";
import type { Request, Response } from "express";
import type * as os from "os";
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private readonly logger = new Logger(LoggerMiddleware.name);
    
    // Safelist of URL patterns to skip logging
    private readonly logSafelist = [
        '/health',
        '/metrics',
        '/favicon.ico'
    ];
    
    private shouldSkipLogging(url: string): boolean {
        return this.logSafelist.some(pattern => url.startsWith(pattern));
    }
    
    use(req: Request, res: Response, next: () => void): void {
        const { ip, method, originalUrl: url } = req;
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const hostname = (require("os") as typeof os).hostname();
        const userAgent = req.get("user-agent") ?? "";
        const referer = req.get("referer") ?? "";
        res.on("close", () => {
            // Skip logging for safelisted URLs
            if (this.shouldSkipLogging(url)) {
                return;
            }
            
            const { statusCode, statusMessage } = res;
            const contentLength = res.get("content-length");
            // Enhanced debug logging with structured data and green-colored path
            const greenPath = `\x1b[32m${url}\x1b[0m`;
            this.logger.debug(`[${hostname}] "${method} ${greenPath}" ${String(statusCode)} ${statusMessage} ${String(contentLength)} "${referer}" "${userAgent}" "${String(ip)}"`);
            // NOTE: Do NOT call res.end() here - it interrupts streaming responses
            // and causes HTTP/2 protocol errors (ERR_HTTP2_PROTOCOL_ERROR)
        });
        next();
    }
}
