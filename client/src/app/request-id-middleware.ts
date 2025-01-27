import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';


@Injectable()
export class RequestIdMiddleware implements NestInterceptor {
 intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const {method, originalUrl, body: requestBody} = request;

    // Log incoming request details
    console.log(`Incoming Request: ${method} ${originalUrl}`);
    console.debug('Request Body:', JSON.stringify(requestBody));

    const now = Date.now();

    return next.handle().pipe(
      tap((data) => {
        // Log the outgoing response
        const processingTime = Date.now() - now;
        console.log(`Response for ${method} ${originalUrl} in ${processingTime}ms`);
        console.debug('Response Body:', JSON.stringify(data));
      }),
    );
  }
}
