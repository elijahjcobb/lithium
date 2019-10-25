import { ArrayList } from "@ejc-tsds/arraylist";
import { LiProxy } from "./LiProxy";

export type LiObjectProps<T extends object> = {
	[P in keyof T]: T[P] | undefined;
};
export type LiObjectBase = {
	id: string | undefined;
	archived: boolean | undefined;
	createdAt: Date | undefined;
	updatedAt: Date | undefined;
};

export type LiObjectKey<T extends object> = ((keyof LiObjectBase) | (keyof LiObjectProps<T>));

/**
 *
 */
export abstract class LiObject<Props extends object> {

	private currentKeys: ArrayList<keyof LiObjectProps<Props>>;
	private archived: boolean | undefined;
	private createdAt: Date | undefined;
	private updatedAt: Date | undefined;
	private id: string | undefined;
	private table: string;
	public props: LiObjectProps<Props>;


	/**
	 * This is a protected constructor for your class to call in its constructor. It takes only a table name.
	 * @param table The name of the table the LiObject will represent.
	 */
	protected constructor(table: string) {

		this.table = table;
		this.currentKeys = new ArrayList<keyof LiObjectProps<Props>>();
		this.onSet = this.onSet.bind(this);
		this.props = LiProxy.watch(this.onSet);

	}

	/**
	 * A private handler that is called when an LiProxy notices a change to the props object.
	 * @param key The key that was changed.
	 * @param value The new value.
	 */
	private onSet(key: string | number | symbol, value: any): void {

		this.currentKeys.add(key as keyof Props);

	}

	public trackedProps(): (keyof LiObjectProps<Props>)[] {

		return this.currentKeys.toArray();

	}


	/**
	 * Check if the LiObject instance is archived.
	 * @returns {boolean} True if the instance is archived.
	 */
	public isArchived(): boolean {

		return this.archived == undefined ? false : this.archived;

	}

	/**
	 * Fetch the identifier that represents this instance.
	 * @returns {string | undefined} The id may be undefined if the object has not been fetched or created.
	 */
	public getId(): string | undefined {

		return this.id;

	}

	/**
	 * Get a date for when the instance was created.
	 * @returns {Date | undefined} May be undefined if the object has not been fetched or created.
	 */
	public getCreatedAt(): Date | undefined {

		return this.createdAt;

	}


	/**
	 * Get a date for when the instance was last updated.
	 * @returns {Date | undefined} May be undefined if the object has not been fetched or created.
	 */
	public getUpdatedAt(): Date | undefined {

		return this.updatedAt;

	}

	/**
	 * Update all keys that are on the current instance.
	 * @returns {Promise<void>}
	 */
	public async update(): Promise<void> {

	}

	/**
	 * Update specific keys that are on the current instance.
	 * @param keys The keys that you wish to update.
	 * @returns {Promise<void>}
	 */
	public async updateProp(...keys: LiObjectKey<LiObjectProps<Props>>[]): Promise<void> {

	}

	/**
	 * Archive the current instance.
	 * @returns {Promise<void>}
	 */
	public async archive(): Promise<void> {

	}

	/**
	 * Restore the current instance (un-archive).
	 * @returns {Promise<void>}
	 */
	public async restore(): Promise<void> {

	}

	/**
	 * Permanently delete the instance.
	 * @returns {Promise<void>}
	 */
	public async destroy(): Promise<void> {



	}

	/**
	 * Populate the instance with values from the database.
	 * @param id The id the current instance should point to if you provide it as null, it will use current id.
	 * @param keys The keys to fetch from the database.
	 * @returns {Promise<void>}
	 */
	public async fetch(id?: string, keys?: LiObjectKey<LiObjectProps<Props>>[]): Promise<void> {

		this.currentKeys.fromArray(keys as (keyof LiObjectProps<Props>)[]);

	}

}