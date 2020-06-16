import { Disposable } from "@hediet/std/disposable";
import * as React from "react";
import { ResizeObserverWithEvents } from "./ResizeObserverWithEvents";

export class MeasuredDiv extends React.Component<
	React.PropsWithChildren<{
		className?: string;
		style?: React.CSSProperties;
		/** Is called when initial size is known and on every resize. */
		onLayout?: (args: LayoutEventArgs) => void;
		resizeObserver: ResizeObserverWithEvents;
	}>
> {
	private readonly divRef = React.createRef<HTMLDivElement>();
	private disposable: Disposable | undefined;

	override render() {
		const { style, children } = this.props;
		return (
			<div
				className={this.props.className}
				ref={this.divRef}
				style={{ display: "flex", flexDirection: "column", ...style }}
			>
				{children}
			</div>
		);
	}

	private getSize(): { height: number; width: number } {
		const div = this.divRef.current;
		if (!div) {
			return {
				height: 0,
				width: 0,
			};
		}
		const rect = div.getBoundingClientRect();
		return { height: rect.height, width: rect.width };
	}

	override componentDidUpdate() {
		if (this.props.onLayout) {
			this.props.onLayout(this.getSize());
		}
	}

	override componentDidMount() {
		const div = this.divRef.current!;

		if (this.props.onLayout) {
			this.props.onLayout(this.getSize());
		}

		const resizeObserver = this.props.resizeObserver;
		if (resizeObserver) {
			resizeObserver.observe(div);
			this.disposable = resizeObserver.onResize.sub(() => {
				if (this.props.onLayout) {
					this.props.onLayout(this.getSize());
				}
			});
		}
	}

	override componentWillUnmount() {
		if (this.disposable) {
			this.disposable.dispose();
			this.disposable = undefined;
		}
	}
}

export type LayoutEventArgs = { height: number; width: number };
