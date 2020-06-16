import { HTMLDivProps } from "@blueprintjs/core";
import { computed, makeObservable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import {
	DocumentElement,
	FunctionElement,
	ListElement,
	TextElement,
	VarElement,
} from "./DocumentModel";
import { DocumentViewModel } from "./DocumentViewModel";
import ReactDOM from "react-dom";

export function renderElement(
	element: DocumentElement,
	viewModel: DocumentViewModel,
) {
	switch (element.kind) {
		case "text":
			return <TextElementView element={element} viewModel={viewModel} />;
		case "var":
			return <VarElementView element={element} viewModel={viewModel} />;
		case "function":
			return (
				<FunctionElementView element={element} viewModel={viewModel} />
			);
		case "list":
			return <ListElementView element={element} viewModel={viewModel} />;
	}
}

abstract class BaseComponent<TProps> extends React.Component<TProps> {
	updateSnapshot: (() => void) | undefined;

	override componentDidUpdate() {
		this.updateSnapshot!();
	}

	override componentDidMount() {
		this.updateSnapshot!();
	}
}

@observer
class TextElementView extends BaseComponent<{
	element: TextElement;
	viewModel: DocumentViewModel;
}> {
	constructor(p: TextElementView["props"]) {
		super(p);

		makeObservable(this);
	}

	@computed get isThisCurrentDropTarget() {
		const { viewModel, element } = this.props;
		return (
			viewModel.currentDropTargetPos &&
			viewModel.currentDropTargetPos.element === element
		);
	}

	override render() {
		const { element, viewModel } = this.props;

		const text = element.text;

		if (this.isThisCurrentDropTarget && viewModel.currentDropTargetPos) {
			if (viewModel.currentDropTargetPos.element === element) {
				const before = text.slice(
					0,
					viewModel.currentDropTargetPos.offset,
				);
				const after = text.slice(viewModel.currentDropTargetPos.offset);

				return (
					<span
						ref={viewModel.associateRootNodeTo(element, this)}
						key={viewModel.getKey(element)}
					>
						<TextNode
							text={before}
							innerRef={viewModel.associateNodeTo(element)}
						/>

						<span
							ref={viewModel.associateNodeTo(element, {
								textOffset: before.length,
							})}
							style={{
								border: "1px solid black",
								//pointerEvents: "none",
							}}
						/>

						<TextNode
							text={after}
							innerRef={viewModel.associateNodeTo(element, {
								textOffset: before.length,
							})}
						/>
					</span>
				);
			}
		}
		return (
			<span
				ref={viewModel.associateRootNodeTo(element, this)}
				key={viewModel.getKey(element)}
			>
				<TextNode
					text={text}
					innerRef={viewModel.associateNodeTo(element)}
				/>
			</span>
		);
	}
}

class TextNode extends React.Component<{
	text: string;
	innerRef?: (textNode: Node | null) => void;
}> {
	override componentDidMount() {
		if (this.props.innerRef) {
			this.props.innerRef(ReactDOM.findDOMNode(this)); // eslint-disable-line
		}
	}

	override componentDidUpdate() {
		if (this.props.innerRef) {
			this.props.innerRef(ReactDOM.findDOMNode(this)); // eslint-disable-line
		}
	}

	override shouldComponentUpdate(nextProps: this["props"]): boolean {
		const n = ReactDOM.findDOMNode(this); // eslint-disable-line
		if (!n) {
			return true;
		}
		return nextProps.text !== n.textContent;
	}

	override render() {
		return this.props.text;
	}
}

@observer
class FunctionElementView extends BaseComponent<{
	element: FunctionElement;
	viewModel: DocumentViewModel;
}> {
	override render() {
		const { element, viewModel } = this.props;

		return (
			<div
				ref={viewModel.associateRootNodeTo(element, this)}
				style={{
					display: "inline-block",
					margin: "0",
					border: "1px solid #0E5A8A",
				}}
				contentEditable={false}
				draggable
				key={viewModel.getKey(element)}
			>
				<div style={{ display: "flex", alignItems: "stretch" }}>
					<div
						style={{
							background: "#2B95D6",
							padding: 3,
							color: "white",
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
						}}
					>
						Plural
					</div>

					<div>
						<div
							style={{
								display: "flex",
								alignItems: "stretch",
							}}
						>
							<div
								style={{
									background: "#2B95D6",
									color: "white",
									display: "flex",
									flexDirection: "column",
									justifyContent: "center",
									padding: "0 4px 0 0px",
								}}
							>
								one
							</div>
							<div
								contentEditable
								suppressContentEditableWarning
								style={{
									padding: 3,
								}}
							>
								{renderElement(element.arg1, viewModel)}
							</div>
						</div>
						<div
							style={{
								border: "solid #0E5A8A",
								borderWidth: "1px 0 0 0",
							}}
						/>
						<div
							style={{
								display: "flex",
								alignItems: "stretch",
							}}
						>
							<div
								style={{
									background: "#2B95D6",
									color: "white",
									display: "flex",
									flexDirection: "column",
									justifyContent: "center",
									padding: "0 4px 0 0px",
								}}
							>
								many
							</div>
							<div
								contentEditable
								suppressContentEditableWarning
								style={{
									padding: 3,
								}}
							>
								{renderElement(element.arg2, viewModel)}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

@observer
class VarElementView extends BaseComponent<{
	element: VarElement;
	viewModel: DocumentViewModel;
}> {
	override render() {
		const { element, viewModel } = this.props;

		return (
			<span
				ref={viewModel.associateRootNodeTo(element, this)}
				style={{
					display: "inline-block",
					padding: 3,
					margin: "0",
					background: "#2B95D6",
					border: "1px solid #0E5A8A",
					color: "white",
				}}
				draggable
				contentEditable={false}
				key={viewModel.getKey(element)}
			>
				{this.props.element.name}
			</span>
		);
	}
}

@observer
export class ListElementView extends BaseComponent<
	{
		element: ListElement;
		viewModel: DocumentViewModel;
		innerRef?: (node: HTMLElement | null) => void;
	} & HTMLDivProps
> {
	override render() {
		const { element, viewModel } = this.props;
		return (
			<div
				ref={(node) => {
					viewModel.associateRootNodeTo(element, this)(node);
					if (this.props.innerRef) {
						this.props.innerRef(node);
					}
				}}
				key={viewModel.getKey(element)}
				className="list"
				style={{ minHeight: 18 }}
				suppressContentEditableWarning={true}
				contentEditable
			>
				{element.items.map((item) => (
					<React.Fragment key={item.id}>
						{renderElement(item, viewModel)}
					</React.Fragment>
				))}
			</div>
		);
	}
}
