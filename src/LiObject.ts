abstract class LiObject<Props extends object> {

	public table: string;
	public id: string | undefined;
	public props: Props;
	public archived: boolean | undefined;
	public createdAt: Date | undefined;
	public updatedAt: Date | undefined;

	protected constructor(table: string) {

		this.table = table;
		this.props = {} as Props;

	}

	public update(): void {

	}

	public updateProp(...keys: [keyof Props]): void {

	}

	public archive(): void {

	}

	public restore(): void {

	}

	public destroy(): void {

	}

}