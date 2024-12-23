interface RequestData<T> {
  payload?: T;
}

export class FetchClient {
  constructor(private url: string) {
  }

  async post<T>(url: string, data: RequestData<T>): Promise<void> {
    try {
      const res = await fetch(`${this.url}/${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.payload),
      });
      const text = await res.text();
      if (!res.ok) {
        throw Error(text);
      }
      console.debug(`POST:OK ${this.url}/${url} ${JSON.stringify(data)}: ${text}`);
    } catch (e) {
      throw new Error(`POST:FAIL: ${this.url}/${url} : ${e.message}`, e);
    }
  }

  async get(url: string): Promise<void> {
     try {
      const res = await fetch(`${this.url}/${url}`);
      const text = await res.text();
      if (!res.ok) {
        throw Error(text);
      }
      console.debug(`GET:OK ${this.url}/${url}: ${text}`);
    } catch (e) {
      throw new Error(`GET:FAIL ${this.url}/${url} : ${e.message}`, e);
    }
  }
}
