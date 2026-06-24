import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthGuard } from './google-auth.guard';

describe('GoogleAuthGuard', () => {
  it('rejects Google OAuth when credentials are not configured', () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const guard = new GoogleAuthGuard(configService);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ query: {} }),
        getResponse: () => ({}),
      }),
    };

    expect(() => guard.canActivate(context as any)).toThrow(
      ServiceUnavailableException,
    );
  });
});
