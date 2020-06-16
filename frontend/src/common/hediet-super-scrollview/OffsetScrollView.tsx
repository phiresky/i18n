import { makeObservable, observable, runInAction } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";

@observer
export class OffsetScrollView extends React.Component<{
	contentOffsetY: number;
	style: React.CSSProperties;
	onScroll?: (args: { x: number; y: number }) => void;
	children: React.ReactNode | undefined;
}> {
	@observable private currentContentOffset = 0;
	private lastContentOffset: number | undefined = undefined;
	private readonly scrollViewRef = React.createRef<HTMLDivElement>();

	private scrollTop = 0;
	private isScrollingActiveTimeout:
		| ReturnType<typeof setTimeout>
		| undefined = undefined;

	constructor(props: OffsetScrollView["props"]) {
		super(props);
		makeObservable(this);
	}

	override render(): React.ReactNode {
		return (
			<div
				ref={this.scrollViewRef}
				style={{
					display: "flex",
					overflow: "auto",
					...this.props.style,
				}}
				onScroll={this.handleScroll}
			>
				<div
					style={{
						display: "flex",
						flex: 1,
						marginTop: -this.currentContentOffset,
					}}
				>
					{this.props.children}
				</div>
			</div>
		);
	}

	public override componentDidMount() {
		this.lastContentOffset = this.props.contentOffsetY;
		this.debouncedFixScroll();
	}

	public override componentDidUpdate() {
		this.debouncedFixScroll();
	}

	private debouncedFixScroll() {
		if (this.isScrollingActiveTimeout) {
			clearTimeout(this.isScrollingActiveTimeout);
		}

		this.isScrollingActiveTimeout = setTimeout(() => {
			this.isScrollingActiveTimeout = undefined;
			// debounced, so that it does not mess with active scroll animations.
			this.fixScrollCompensation();
		}, 300);
	}

	private fixScrollCompensation() {
		let scrollTo: number | undefined = undefined;

		runInAction(() => {
			this.currentContentOffset = this.props.contentOffsetY;

			const scrollOffset =
				this.currentContentOffset - this.lastContentOffset!;
			if (Math.abs(scrollOffset) <= 0.1) {
				return;
			}

			const newScrollY = this.scrollTop - scrollOffset;

			this.lastContentOffset = this.currentContentOffset;
			this.scrollTop = newScrollY;
			scrollTo = newScrollY;
		});

		if (scrollTo !== undefined) {
			this.scrollViewRef.current!.scroll({
				top: scrollTo,
				behavior: "auto",
			});
			// Manual scrolling does not seem to trigger
			// a scroll event so we do it manually.
			this.handleScroll();
		}
	}

	private readonly handleScroll = () => {
		const newTop = this.scrollViewRef.current!.scrollTop;
		this.scrollTop = newTop;
		if (this.props.onScroll) {
			this.props.onScroll({
				x: 0,
				y: this.scrollTop + this.currentContentOffset,
			});
		}

		this.debouncedFixScroll();
	};
}
