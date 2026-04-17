import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      query?: { prompt?: string };
    }>();
    const prompt = request.query?.prompt;

    return {
      scope: ['email', 'profile'],
      session: false,
      prompt: prompt === 'select_account' ? 'select_account' : undefined,
    };
  }
}