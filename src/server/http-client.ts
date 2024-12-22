interface RequestData<T> {
  payload?: T;
}

export class FetchClient {
  constructor(private url: string) {
  }

  async post<T>(url: string, data: RequestData<T>): Promise<void> {
    const res = await fetch(`${this.url}/${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data.payload),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(text);
    }
  }

  async get(url: string): Promise<void> {
    const res = await fetch(`${this.url}/${url}`);
    const text = await res.text();
    if (!res.ok) {
      throw new Error(text);
    }
  }
}
