import { request, RequestOptions } from 'https';
import { IncomingMessage } from 'http';
import { resolve } from 'dns';

export class Utils {
  private parseHttpRequestError(options: IHttpRequestOptions, data: string, response: any): IHttpRequestReject {
    return {
      statusCode: response.statusCode || '',
      request: data,
      response: response
    } as IHttpRequestReject;
  }

  private parseHttpPutResponse(response: IncomingMessage): IHttpResponse {
    return {
      statusCode: response.statusCode || 0,
      statusMessage: response.statusMessage || '',
    }
  }

  public httpRequest(options: IHttpRequestOptions, data: any): Promise<IHttpResponse> {
    const dataPost = JSON.stringify(data).normalize('NFD').replace(/[\u0300-\u036f]/g, "");

    return new Promise<IHttpResponse>((resolve, reject) => {
      if (options && options.headers)
        options.headers['Content-Length'] = Buffer.byteLength(dataPost)
      const req = request(options, (res: IncomingMessage) => {
        var chunks: string = '';
        res.on('data', (chunk: any) => chunks += chunk);
    
        res.on('end', () => {
          const response = (chunks.length > 0) ? JSON.parse(chunks) : '';
          if (res.statusCode && [200, 201].indexOf(res.statusCode) === -1) return reject(this.parseHttpRequestError(options, data, response));
          if (options.method === 'PUT' && chunks.length === 0) return resolve(this.parseHttpPutResponse(res));
          return resolve({
            ...this.parseHttpPutResponse(res),
            data: response
          })
        });
      });

      req.write(dataPost)
      req.on('error', (err) => reject(err))
      req.end()
    });
  }
}

export enum HttpRequestMethodEnum {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT'
}

export interface IHttpRequestOptions extends RequestOptions {
  method: HttpRequestMethodEnum;
  path: string;
  hostname: string;
  headers: any;
  encoding: string;
  port: number;
}

export interface IHttpRequestReject {
  statusCode: string;
  request: string;
  response: IncomingMessage;
}

/**
 * Interface com dados que serão retornados em todas as requisições
 */
export interface IHttpResponse {
  statusCode: number;
  statusMessage: string;
  data?: any;
}