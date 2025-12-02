import { Controller, Get } from '@nestjs/common';
import { Session, OptionalAuth } from '@/core/modules/auth/decorators/decorators';

@Controller('test-session')
export class TestSessionController {
  @Get()
  @OptionalAuth()
  testSession(@Session() session: any) {
    console.log('=== Session Debug ===');
    console.log('Session type:', typeof session);
    console.log('Session value:', session);
    console.log('Session keys:', session ? Object.keys(session) : 'null');
    console.log('Has session property?', session && 'session' in session);
    console.log('Has user property?', session && 'user' in session);
    console.log('====================');
    
    return {
      message: 'Session debug info logged to console',
      sessionType: typeof session,
      sessionIsNull: session === null,
      sessionKeys: session ? Object.keys(session) : [],
      hasNestedSession: session && 'session' in session,
      hasUser: session && 'user' in session,
    };
  }
}
