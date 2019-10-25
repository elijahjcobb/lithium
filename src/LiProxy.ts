export class LiProxy<T extends object> implements ProxyHandler<T> {

	private readonly onSet: (key: string | number | symbol, value: any) => void;

	public constructor(onSet: (key: string | number | symbol, value: any) => void) {

		this.onSet = onSet;

	}

	public set(target: T, p: string | number | symbol, value: any, receiver: any): boolean {

		this.onSet(p, value);

		// @ts-ignore
		target[p] = value;

		return true;

	}

	public static watch<T extends object>(onSet: (key: string | number | symbol, value: any) => void): T {

		return new Proxy<T>({} as T, new LiProxy(onSet));

	}

}