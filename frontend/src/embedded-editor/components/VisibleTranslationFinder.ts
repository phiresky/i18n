import {
	action,
	computed,
	makeObservable,
	observable,
	runInAction,
} from "mobx";
import { decode } from "zwsp-steg";
import { Point, PointLike, Rectangle } from "../utils/Point";

export class VisibleTranslationFinder {
	@observable
	public translatables = new Array<VisibleTranslation>();
	private resizeObserver = new ResizeObserver(() => {
		action("Update regions", () => {
			for (const t of this.translatables) {
				t.updateRegion();
			}
		})();
	});

	constructor() {
		makeObservable(this);
	}

	public findTranslatableAt(
		position: PointLike,
	): VisibleTranslation | undefined {
		return this.translatables.find((t) =>
			t.region.intersects(Rectangle.ofSize(position, { x: 1, y: 1 })),
		);
	}

	@action
	public updateTranslatables() {
		function textNodesUnder(root: Element): Text[] {
			const textNodes = new Array<Text>();
			addTextNodes(root);
			for (const n of Array.from(root.querySelectorAll("*"))) {
				addTextNodes(n);
			}
			return textNodes;

			function addTextNodes(el: Element) {
				textNodes.push(
					...Array.from(el.childNodes).filter(
						(k): k is Text => k.nodeType == Node.TEXT_NODE,
					),
				);
			}
		}

		this.resizeObserver.disconnect();

		const translatables = textNodesUnder(window.document.body).filter(
			(t) => decode(t.textContent || "").length > 0,
		);

		this.translatables = translatables.map((t) => {
			this.resizeObserver.observe(t.parentElement!);
			return new VisibleTranslation(decode(t.textContent!), t);
		});
	}
}

export class VisibleTranslation {
	@observable invalidationKey = 0;

	@computed get region(): Rectangle {
		this.invalidationKey;
		scrollWatcher.scrollKey;

		if (!this.textNode.parentElement) {
			return Rectangle.ofSize(Point.Zero, Point.Zero);
		}

		const bounding = this.textNode.parentElement.getBoundingClientRect();
		return Rectangle.ofSize(bounding, {
			x: bounding.width,
			y: bounding.height,
		});
	}

	constructor(
		public readonly codeId: string,
		public readonly textNode: Text,
	) {
		makeObservable(this);
	}

	public updateRegion() {
		this.invalidationKey++;
	}
}

export class ScrollWatcher {
	@observable scrollKey = 0;

	constructor() {
		makeObservable(this);
		window.addEventListener(
			"scroll",
			() => {
				runInAction(() => {
					this.scrollKey++;
				});
			},
			{ capture: true },
		);
	}
}
const scrollWatcher = new ScrollWatcher();
