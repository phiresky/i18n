/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { observer } from "mobx-react";
import * as React from "react";
import {
	DocumentModel,
	FunctionElement,
	ListElement,
	TextElement,
	VarElement,
} from "./DocumentModel";
import { DocumentViewModel } from "./DocumentViewModel";
import { ListElementView } from "./renderElement";

function getNodeAndOffsetAtCursor(e: React.DragEvent<HTMLDivElement>): {
	node: Node;
	offset: number;
} {
	const r = document.caretRangeFromPoint(e.clientX, e.clientY);
	return {
		node: r!.startContainer,
		offset: r!.startOffset,
	};
}

const m = new DocumentModel();
m.root = new ListElement([
	new TextElement("You havae "),
	new VarElement("count"),
	//new TextElement(""),
	new VarElement("count"),
	new TextElement(" emails"),
	new FunctionElement(
		"test",
		new ListElement([new TextElement("bla")]),
		new ListElement([new TextElement("bla")]),
	),
	new TextElement("."),
]);

export const vm = new DocumentViewModel(m);
if ((window as any).vm) {
	(window as any).vm.dispose();
}
(window as any).vm = vm;

@observer
export class CustomEditor extends React.Component {
	override render() {
		return (
			<div>
				<CustomEditorImpl />
				<div style={{ whiteSpace: "pre" }}>
					{JSON.stringify(vm.model.root.toJSON(), undefined, 4)}
				</div>
			</div>
		);
	}
}

@observer
export class CustomEditorImpl extends React.Component {
	// private lastSelection: ElementSelection | undefined;

	override componentDidUpdate() {
		//vm.setSelection(this.lastSelection);
	}

	override render() {
		//this.lastSelection = vm.getCurrentSelection();

		return (
			<div style={{ margin: 10 }} id="customEditor">
				<div
					style={{
						border: "1px solid black",
						padding: 2,
						whiteSpace: "pre",
					}}
					onDragOver={(e) => {
						if (!vm.draggedElement) {
							return;
						}
						const nodeAndOffset = getNodeAndOffsetAtCursor(e);
						const elemPos = (vm as any).getElementPosFromDomNode(
							nodeAndOffset,
						);
						vm.currentDropTargetPos = elemPos;
						if (elemPos) {
							e.preventDefault();
						}
					}}
					onDragEnter={(e) => {
						const nodeAndOffset = getNodeAndOffsetAtCursor(e);
						const elemPos = (vm as any).getElementPosFromDomNode(
							nodeAndOffset,
						);
						console.log("drag enter", nodeAndOffset);
						vm.currentDropTargetPos = elemPos;
						if (elemPos) {
							e.preventDefault();
						}
					}}
					onDragStart={(e) => {
						console.log(e.target, document.getSelection());
						/*const elemPos = vm.getElementPosFromDomNode({
							node: e.target as HTMLElement,
						});*/
						//if (!elemPos) {
						e.preventDefault();
						return;
						/*}

						vm.draggedElement = elemPos.element;*/
					}}
					onDrop={(e) => {
						if (!vm.currentDropTargetPos || !vm.draggedElement) {
							return;
						}
						(vm as any).insert(
							vm.currentDropTargetPos,
							vm.draggedElement,
						);
						vm.currentDropTargetPos = undefined;
					}}
					onDragEnd={(e) => {
						console.log("onDragEnd", e);
					}}
					onKeyDown={(e) => {
						//e.preventDefault();

						// handle control keys that modify structure

						console.log(
							"onKeyDown",
							e.charCode,
							e.key,
							e.keyCode,
							e.which,
						);

						if (e.key === "Enter") {
							e.preventDefault();
						}
						/*
						if (e.key === "Backspace") {
							e.preventDefault();

							const c = vm.getCurrentSelection();
							if (!c) {
								throw new Error("invalid");
							}
							console.log(c.element, c.offset);
							if (
								c.element.kind === "text" &&
								c.offset !== undefined &&
								c.offset > 0
							) {
								//c.element.text.
							} else {
								e.preventDefault();
							}
						}*/
					}}
					onInput={(e) => {
						console.log("onInput", e, e.target);
						vm.applyDiffs();
					}}
					onPaste={(e) => {
						console.log("onPaste");
						//e.preventDefault();
					}}
					onCopy={(e) => {
						console.log("onCopy");
						//e.preventDefault();
					}}
					onCut={(e) => {
						console.log("onCut");
						//e.preventDefault();
					}}
					onCompositionEnd={(e) => {
						console.log("onCompositionEnd");
						//e.preventDefault();
					}}
					onCompositionStart={(e) => {
						console.log("onCompositionStart");
						//e.preventDefault();
					}}
					onCompositionUpdate={(e) => {
						console.log("onCompositionUpdate");
						//e.preventDefault();
					}}
					onBeforeInput={(e) => {
						console.log(
							"onBeforeInput",
							JSON.stringify((e as any).data),
						);

						//e.preventDefault();
					}}
				>
					<ListElementView
						innerRef={(node) => (vm.rootNode = node)}
						element={vm.model.root}
						viewModel={vm}
					/>
				</div>
			</div>
		);
	}
}
