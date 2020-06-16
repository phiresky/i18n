import * as React from "react";
import { CustomEditor } from "./CustomEditor";

export class ExperimentalPage extends React.Component {
	override render() {
		return <CustomEditor />;
	}
}

/*
export class Text extends React.Component {
	override render() {
		return (<>)
	}
}*/

export class Nested extends React.Component {
	override render() {
		return (
			<div
				style={{
					display: "inline-block",

					margin: "0 2px",

					border: "1px solid #0E5A8A",
				}}
				contentEditable={false}
				draggable
			>
				<div style={{ display: "flex", alignItems: "center" }}>
					<div
						style={{
							background: "#2B95D6",
							padding: 3,
							color: "white",
						}}
					>
						A
					</div>
					<div
						style={{
							padding: 3,
						}}
					>
						<div contentEditable>here</div>
					</div>
				</div>
			</div>
		);
	}
}

export class Variable extends React.Component {
	override render() {
		return (
			<span
				style={{
					display: "inline-block",
					padding: 3,
					margin: "0 2px",
					background: "#2B95D6",
					border: "1px solid #0E5A8A",
					color: "white",
				}}
				contentEditable={false}
			>
				count
			</span>
		);
	}
}

/*
class List extends React.Component {
	override render() {
		const msgs = new Array<Message>();
		for (let i = 0; i < 10000; i++) {
			msgs.push(
				new Message(
					`${i}${
						LoremIpsumMessages[(i % LoremIpsumMessages.length) - 1]
					}`
				)
			);
		}

		return (
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					height: "100%",
					border: "1px solid black",
				}}
			>
				<SuperScrollView
					itemProvider={
						new SimpleItemProvider(
							msgs.map((m, idx) => ({
								get height() {
									return m.height;
								},
								id: "a" + idx,
								render: () => <MessageComponent msg={m} />,
							}))
						)
					}
				/>
			</div>
		);
	}
}

class Message {
	@observable height: number = 100;

	constructor(public readonly text: string) {}
}

const resizeObserver = new ResizeObserverWithEvents();

export class MessageComponent extends React.Component<{ msg: Message }> {
	override render() {
		return (
			<MeasuredDiv
				resizeObserver={resizeObserver}
				onLayout={l => (this.props.msg.height = l.height)}
			>
				<div
					style={{
						border: "1px solid",
						padding: 10,
						margin: 5,
						background: "lightgray",
					}}
				>
					{this.props.msg.text}
				</div>
			</MeasuredDiv>
		);
	}
}
*/
