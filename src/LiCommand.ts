import { Dictionary } from "@ejc-tsds/dictionary";
import { ArrayList } from "@ejc-tsds/arraylist";


enum LiCommandMethod {
	select = "SELECT",
	update = "UPDATE",
	insert = "INSERT",
	delete = "DELETE",
	count = "COUNT"
}

type LiCommandSort = "<" | ">";
type LiCommandOperator = "=" | "!=" | ">" | "<" | ">=" | "<=" | "in";
type LiCommandValue = string | number | boolean | undefined | null | Buffer;

const escapeValue: (value: LiCommandValue) => string | number | boolean = (value: LiCommandValue): string | number | boolean => {

	if (value === null || value === undefined) return "NULL";
	else if (typeof value === "string") {

		let escaped: string = value;

		escaped = escaped.replace(RegExp(`'`, "g"), `\\'`);
		escaped = escaped.replace(RegExp(`"`, "g"), `\\"`);
		escaped = `'${escaped}'`;

		return escaped;

	} else if (Buffer.isBuffer(value)) {

		let encodedData: string;

		try {

			encodedData = value.toString("hex");

		} catch (e) {

			throw Error("Failed to encode Buffer to base64 string.");

		}

		return `'${encodedData}'`;

	} else return value;

};

interface ECSQLGeneratable {
	generate(): string;
}

export class LiCommand implements ECSQLGeneratable {

	private method: LiCommandMethod;
	private table: string | undefined;
	private orderings: { key: string, direction: LiCommandSort}[] = [];
	private limitOfItems: number = -1;
	private parameters: Dictionary<string, LiCommandValue> = new Dictionary<string, LiCommandValue>();
	private queries: LiCommandQuery | undefined;

	private constructor(method: LiCommandMethod, table?: string) {

		this.table = table;
		this.method = method;

	}

	public sort(key: string, direction: LiCommandSort): LiCommand {

		this.orderings.push({ key, direction });
		return this;

	}

	public limit(limit: number): LiCommand {

		this.limitOfItems = limit;
		return this;

	}

	public set(key: string, value: LiCommandValue): LiCommand {

		this.parameters.set(key, value);
		return this;

	}

	public generate(table?: string): string {

		let command: string = "";
		if (table) this.table = table;
		if (this.table === undefined) throw new Error("Table must be defined.");

		if (this.method === LiCommandMethod.select) {

			command = `SELECT * FROM ${this.table}`;
			if (this.queries) command += ` WHERE ${this.queries.generate()}`;
			if (this.orderings.length > 0) {

				command += ` ORDER BY `;
				const formattedOrders: string[] = [];

				this.orderings.forEach((ordering: { key: string, direction: LiCommandSort}) => {

					formattedOrders.push(`${ordering.key} ${ordering.direction === "<" ? "ASC" : "DESC"}`);

				});

				command += formattedOrders.join(", ");
			}

			if (this.limitOfItems !== -1) command += ` LIMIT ${this.limitOfItems}`;

		} else if (this.method === LiCommandMethod.insert) {

			command = `INSERT INTO ${this.table}`;
			if (this.queries) command += ` WHERE ${this.queries.generate()}`;
			if (this.parameters.size() === 0) throw new Error("You must specify at least one parameter to insert.");

			command += ` (${this.parameters.keys().join(", ")}) VALUES (`;
			command += this.parameters.values().map((value: LiCommandValue) => { return escapeValue(value); }).join(", ");
			command += ")";

		} else if (this.method === LiCommandMethod.delete) {

			command = `DELETE FROM ${this.table}`;
			if (this.queries) command += ` WHERE ${this.queries.generate()}`;

		} else if (this.method === LiCommandMethod.update) {

			command += `UPDATE ${this.table} SET`;

			const updateItems: string[] = [];

			this.parameters.forEach((key: string, value: LiCommandValue) => {

				updateItems.push(`${key}=${escapeValue(value)}`);

			});

			command += ` ${updateItems.join(", ")}`;

			if (this.queries) command += ` WHERE ${this.queries.generate()}`;

		} else if (this.method === LiCommandMethod.count) {

			command = `SELECT COUNT(*) FROM ${this.table}`;
			if (this.queries) command += ` WHERE ${this.queries.generate()}`;
			if (this.orderings.length > 0) {

				command += ` ORDER BY `;
				const formattedOrders: string[] = [];

				this.orderings.forEach((ordering: { key: string, direction: LiCommandSort}) => {

					formattedOrders.push(`${ordering.key} ${ordering.direction === "<" ? "ASC" : "DESC"}`);

				});

				command += formattedOrders.join(", ");
			}

			if (this.limitOfItems !== -1) command += ` LIMIT ${this.limitOfItems}`;

		}

		command += ";";

		return command;

	}

	public where(key: string, operator: LiCommandOperator, value: LiCommandValue | string[]): LiCommand {

		this.queries = LiCommandQuery.and().where(key, operator, value);
		return this;

	}

	public whereThese(query: LiCommandQuery): LiCommand {

		this.queries = query;
		return this;

	}

	public whereKeyIsValueOfQuery(key: string, otherTable: string, otherKey: string, value: LiCommandValue): LiCommand {

		this.queries = LiCommandQuery.and().whereKeyIsValueOfQuery(key, otherTable, otherKey, value);
		return this;

	}

	public static select(table?: string): LiCommand { return new LiCommand(LiCommandMethod.select, table); }
	public static update(table?: string): LiCommand { return new LiCommand(LiCommandMethod.update, table); }
	public static insert(table?: string): LiCommand { return new LiCommand(LiCommandMethod.insert, table); }
	public static delete(table?: string): LiCommand { return new LiCommand(LiCommandMethod.delete, table); }
	public static count(table?: string): LiCommand { return new LiCommand(LiCommandMethod.count, table); }

}

type LiCommandQueryCondition = "AND" | "OR";
type LiCommandQueryItems = {
	key: string,
	operator: LiCommandOperator,
	value: LiCommandValue | string[]
};

export class LiCommandSubQuery implements ECSQLGeneratable {
	public readonly key: string;
	public readonly otherTable: string;
	public readonly otherKey: string;
	public readonly value: LiCommandValue;

	public constructor(key: string, otherTable: string, otherKey: string, value: LiCommandValue) {
		this.key = key;
		this.otherTable = otherTable;
		this.otherKey = otherKey;
		this.value = value;
	}

	public generate(): string {

		return `${this.key} IN (SELECT ${this.otherKey} FROM ${this.otherTable} WHERE ${this.otherKey}=${escapeValue(this.value)})`;

	}
}

export class LiCommandQuery implements ECSQLGeneratable {

	private condition: LiCommandQueryCondition | undefined;
	private items: ArrayList<LiCommandQueryItems | LiCommandQuery | LiCommandSubQuery> = new ArrayList<LiCommandQueryItems | LiCommandQuery | LiCommandSubQuery>();

	public where(key: string, operator: LiCommandOperator, value: LiCommandValue | string[]): LiCommandQuery {

		this.items.add({key, operator, value});
		return this;

	}

	public whereThese(query: LiCommandQuery): LiCommandQuery {

		this.items.add(query);
		return this;

	}

	public whereKeyIsValueOfQuery(key: string, otherTable: string, otherKey: string, value: LiCommandValue): LiCommandQuery {

		this.items.add(new LiCommandSubQuery(key, otherTable, otherKey, value));
		return this;

	}

	public generate(): string {

		const parts: string[] = [];

		this.items.forEach((item: LiCommandQueryItems | LiCommandQuery | LiCommandSubQuery) => {

			if (item instanceof LiCommandQuery || item instanceof LiCommandSubQuery) parts.push(item.generate());
			else {
				if (Array.isArray(item.value)) {

					const value: LiCommandValue = "(" + item.value.map((value: string) => {

						return escapeValue(value);

					}).join(", ") + ")";

					parts.push(item.key + " IN " + value);

				} else {

					parts.push(item.key + "" + item.operator + "" + escapeValue(item.value));

				}
			}

		});

		const command: string = parts.join(` ${this.condition} `);
		return `(${command})`;

	}


	private static builder(condition: LiCommandQueryCondition): LiCommandQuery {

		const q: LiCommandQuery = new LiCommandQuery();
		q.condition = condition;

		return q;

	}

	public static and(): LiCommandQuery { return this.builder("AND"); }
	public static or(): LiCommandQuery { return this.builder("OR"); }


}
