import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { Request, Response } from 'express';
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private readonly logger = new Logger(LoggerMiddleware.name);
    use(req: Request, res: Response, next: Function) {
        const { ip, method, originalUrl: url } = req;
        const hostname = require('os').hostname();
        const userAgent = req.get('user-agent') || '';
        const referer = req.get('referer') || '';
        res.on('close', () => {
            const { statusCode, statusMessage } = res;
            const contentLength = res.get('content-length');
            // Enhanced debug logging with structured data
            this.logger.debug(`[${hostname}] "${method} ${url}" ${statusCode} ${statusMessage} ${contentLength} "${referer}" "${userAgent}" "${ip}"`);
            console.log('response: ', res.statusCode, res.statusMessage, contentLength, referer, userAgent, ip);
            res.end();
        });
        next();
    }
}
