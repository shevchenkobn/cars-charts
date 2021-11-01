import { DeepReadonly } from './types';

export interface HttpRequest {
  url: string;
  method: string;
}

export function requestHttpText(request: DeepReadonly<HttpRequest>) {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = (arg) => {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.responseText);
        } else {
          reject(new Error(xhr.responseText));
        }
      }
    };
    xhr.open(request.method, request.url);
    xhr.send();
  });
}
