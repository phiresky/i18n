import { makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { LayoutEventArgs, MeasuredDiv } from "./MeasuredDiv";
import { OffsetScrollView } from "./OffsetScrollView";
import { ResizeObserverWithEvents } from "./ResizeObserverWithEvents";
import { Range } from "./utils";

@observer
export class SuperScrollView<TItem extends Item> extends React.Component<{
	itemProvider: ItemProvider<TItem>;
	style?: React.CSSProperties;
	innerStyle?: React.CSSProperties;
}> {
	private readonly resizeObserverWithEvents = new ResizeObserverWithEvents();

	private dummyHeight = 0;

	@observable
	private scrollTop = 0;
	@observable
	private viewPortHeight = 0;

	private readonly handleScroll = (args: { x: number; y: number }) => {
		this.scrollTop = args.y;
	};

	private readonly handleScrollViewLayout = (args: LayoutEventArgs) => {
		this.viewPortHeight = args.height;
	};

	private readonly scrollViewRef = React.createRef<OffsetScrollView>();

	private anchor: PositionedItem<TItem> | undefined;

	constructor(props: {
		itemProvider: ItemProvider<TItem>;
		style?: React.CSSProperties;
		innerStyle?: React.CSSProperties;
	}) {
		super(props);
		makeObservable(this);
	}

	override render() {
		const { itemProvider, style, innerStyle } = this.props;

		if (this.anchor) {
			const oldTop = this.anchor.top;
			const newPos = itemProvider.getPosition(this.anchor.item);
			if (newPos) {
				const newTop = newPos.top;

				// We want: new(this.dummyHeight + top) = old(this.dummyHeight + top)
				// Thus:    new(this.dummyHeight)       = old(this.dummyHeight) + (oldTop - newTop)
				this.dummyHeight += oldTop - newTop;
			}
		}

		const itemsToRender = itemProvider.getItemsInRange({
			start: this.scrollTop - 500 - this.dummyHeight,
			length: this.viewPortHeight + 1000,
		});

		for (const item of itemsToRender) {
			if (item.top + this.dummyHeight >= this.scrollTop) {
				this.anchor = item;
				break;
			}
		}

		const children = itemsToRender.map((positionedItem) => ({
			key: positionedItem.item.id,
			positionedItem,
		}));

		return (
			<MeasuredDiv
				className="superScrollView"
				style={{ display: "flex", ...style }}
				onLayout={this.handleScrollViewLayout}
				resizeObserver={this.resizeObserverWithEvents}
			>
				<OffsetScrollView
					ref={this.scrollViewRef}
					style={{ flex: 1, ...innerStyle }}
					contentOffsetY={this.dummyHeight}
					onScroll={this.handleScroll}
				>
					<div
						style={{
							height: itemProvider.height + this.dummyHeight,
							flex: 1,
							position: "relative",
						}}
					>
						{children.map((item) => (
							<div
								key={item.key}
								style={{
									position: "absolute",
									width: "100%",
									left: 0,
									top:
										item.positionedItem.top +
										this.dummyHeight,
								}}
							>
								{item.positionedItem.item.render()}
							</div>
						))}
					</div>
				</OffsetScrollView>
			</MeasuredDiv>
		);
	}
}

interface ItemProvider<TItem extends Item> {
	height: number;
	getItemsInRange(range: Range): PositionedItem<TItem>[];
	getPosition(item: TItem): PositionedItem<TItem> | undefined;
}

interface PositionedItem<TItem extends Item> {
	top: number;
	item: TItem;
}

interface Item {
	// renderKey: string;
	id: string;
	render(): React.ReactNode;
}

export interface ItemWithHeight extends Item {
	height: number;
}

export class SimpleItemProvider implements ItemProvider<ItemWithHeight> {
	constructor(private readonly items: ItemWithHeight[]) {}

	get height(): number {
		return this.items.reduce((p, c) => p + c.height, 0);
	}

	public getItemsInRange(range: Range): PositionedItem<ItemWithHeight>[] {
		const result = new Array<PositionedItem<ItemWithHeight>>();
		let height = 0;
		for (const item of this.items) {
			const top = height;
			if (
				range.start <= top + item.height &&
				top <= range.start + range.length
			) {
				result.push({ top, item });
			}
			height += item.height;
		}

		return result;
	}

	public getPosition(item: Item): PositionedItem<ItemWithHeight> | undefined {
		let height = 0;
		for (const newItem of this.items) {
			if (item.id === newItem.id) {
				return { top: height, item: newItem };
			}
			height += newItem.height;
		}
		return undefined;
	}
}

/*
		private renderedItems: {
		id: string;
		positionedItem: PositionedItem<TItem>;
		placed: boolean;
	}[] = [];
	
		const placed = new Set<PositionedItem<any>>();
		for (const item of itemsToRender) {
			for (const existing of this.renderedItems) {
				if (existing.positionedItem.item.id === item.item.id) {
					existing.placed = true;
					existing.positionedItem = item;
					placed.add(item);
					break;
				}
			}
		}

		for (const item of itemsToRender) {
			if (placed.has(item)) {
				continue;
			}
			let couldPlace = false;
			for (const existing of this.renderedItems) {
				if (!existing.placed) {
					existing.placed = true;
					existing.positionedItem = item;
					couldPlace = true;
					break;
				}
			}
			if (!couldPlace) {
				this.renderedItems.push({
					id: item.item.id,
					placed: true,
					positionedItem: item,
				});
			}
		}
		for (const r of this.renderedItems) {
			r.placed = false;
		}

		const children = this.renderedItems;
*/
