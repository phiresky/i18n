import { makeObservable, observable } from "mobx";

export class DocumentModel {
	@observable
	public root = new ListElement([]);

	constructor() {
		makeObservable(this);
	}
}

export type DocumentElement =
	| ListElement
	| VarElement
	| FunctionElement
	| TextElement;

export class ElementSelection {
	public static from(start: ElementPos, end?: ElementPos): ElementSelection {
		return new ElementSelection(start, end || start);
	}

	public get isEmpty() {
		return this.start.equals(this.end);
	}

	constructor(
		public readonly start: ElementPos,
		public readonly end: ElementPos,
	) {}
}

export class ElementPos {
	constructor(
		public readonly element: DocumentElement,
		public readonly offset: number | undefined = undefined,
	) {}

	public equals(other: ElementPos): boolean {
		return this.element === other.element && this.offset === other.offset;
	}
}

abstract class DocumentElementBase {
	public static curId = 0;

	private _id = String(DocumentElementBase.curId++);
	public get id() {
		return this._id;
	}

	protected withId(id: string): this {
		this._id = id;
		return this;
	}

	public abstract toJSON(): unknown;

	public abstract replace(
		getReplacement: (
			element: DocumentElement,
		) => DocumentElement | undefined,
	): DocumentElement;
}

export class ListElement extends DocumentElementBase {
	public readonly kind = "list";

	constructor(public readonly items: ReadonlyArray<DocumentElement>) {
		super();
	}

	public toJSON(): unknown {
		return this.items.map((i) => i.toJSON());
	}

	public replace(
		getReplacement: (
			element: DocumentElement,
		) => DocumentElement | undefined,
	): DocumentElement {
		const result = getReplacement(this);
		if (result) {
			return result;
		}

		let changed = false;
		const items = this.items.map((i) => {
			const r = i.replace(getReplacement);
			if (r !== i) {
				changed = true;
			}
			return r;
		});
		if (changed) {
			return new ListElement(items).withId(this.id);
		}

		return this;
	}
}

export class VarElement extends DocumentElementBase {
	public readonly kind = "var";

	constructor(public readonly name: string) {
		super();
	}

	toJSON(): unknown {
		return { kind: "var" };
	}

	public replace(
		getReplacement: (
			element: DocumentElement,
		) => DocumentElement | undefined,
	): DocumentElement {
		const result = getReplacement(this);
		if (result) {
			return result;
		}
		return this;
	}
}

export class FunctionElement extends DocumentElementBase {
	public readonly kind = "function";

	constructor(
		public readonly name: string,
		public readonly arg1: DocumentElement,
		public readonly arg2: DocumentElement,
	) {
		super();
	}

	toJSON(): unknown {
		return {
			kind: "function",
			arg1: this.arg1.toJSON(),
			arg2: this.arg2.toJSON(),
		};
	}

	public replace(
		getReplacement: (
			element: DocumentElement,
		) => DocumentElement | undefined,
	): DocumentElement {
		const result = getReplacement(this);
		if (result) {
			return result;
		}

		const arg1 = this.arg1.replace(getReplacement);
		const arg2 = this.arg2.replace(getReplacement);

		if (arg1 !== this.arg1 || arg2 !== this.arg2) {
			return new FunctionElement(this.name, arg1, arg2).withId(this.id);
		}

		return this;
	}
}

export class TextElement extends DocumentElementBase {
	public readonly kind = "text";

	constructor(public readonly text: string) {
		super();
	}

	toJSON(): unknown {
		return { kind: "text", text: this.text };
	}

	public replace(
		getReplacement: (
			element: DocumentElement,
		) => DocumentElement | undefined,
	): DocumentElement {
		const result = getReplacement(this);
		if (result) {
			return result;
		}
		return this;
	}

	with(text: string): TextElement {
		return new TextElement(text).withId(this.id);
	}
}
