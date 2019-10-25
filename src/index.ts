import { LiObject } from "./LiObject";

interface UserProps {
	name: string;
	age: number;
}

class User extends LiObject<UserProps> {

	public constructor() {

		super("user");

	}
}

const person: User = new User();

console.log(person.trackedProps());
person.props.age = 20;
console.log(person.trackedProps());