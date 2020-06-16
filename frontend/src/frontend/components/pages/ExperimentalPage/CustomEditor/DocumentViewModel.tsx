import { Disposable } from "@hediet/std/disposable";
import { makeObservable, observable, ObservableMap, runInAction } from "mobx";
import {
	DocumentElement,
	DocumentModel,
	ElementPos,
	ListElement,
	TextElement,
} from "./DocumentModel";
import * as React from "react";

interface HistoryData {
	children: Node[];
	text: string | undefined;
}

export class DocumentViewModel {
	public dispose = Disposable.fn();

	private readonly nodeData = new WeakMap<
		Node,
		{
			history: HistoryData;
			owner: unknown;
			rootElement: DocumentElement;
		}
	>();

	private readonly nodeSourceData = new WeakMap<
		Node,
		{
			sourceElement: DocumentElement;
			textOffset?: number;
		}
	>();

	constructor(public readonly model: DocumentModel) {
		makeObservable(this);
	}

	private readonly keys = new ObservableMap<string, number>();

	public getKey(element: DocumentElement): number {
		return this.keys.get(element.id) || 0;
	}

	private invalidateElement(element: DocumentElement): void {
		const key = this.keys.get(element.id) || 0;
		this.keys.set(element.id, key + 1);
	}

	public associateNodeTo(
		element: DocumentElement,
		slice?: { textOffset: number },
	): (ref: Node | null) => void {
		return (node) => {
			if (node) {
				this.nodeSourceData.set(node, {
					sourceElement: element,
					textOffset: slice ? slice.textOffset : undefined,
				});
			}
		};
	}

	private createHistory(node: Node): HistoryData {
		return {
			children: Array.from(node.childNodes),
			text:
				node.nodeType === document.TEXT_NODE
					? (node as Text).data
					: undefined,
		};
	}

	private updatePreviousData(
		node: Node,
		owner: unknown,
		rootElement: DocumentElement,
	) {
		this.nodeData.set(node, {
			owner,
			rootElement,
			history: this.createHistory(node),
		});
		for (const n of Array.from(node.childNodes)) {
			const existing = this.nodeData.get(n);
			if (existing && existing.owner !== owner) {
				return;
			}
			this.updatePreviousData(n, owner, rootElement);
		}
	}

	public associateRootNodeTo(
		element: DocumentElement,
		root: { updateSnapshot: (() => void) | undefined },
	): (ref: Node | null) => void {
		return (node) => {
			if (node) {
				root.updateSnapshot = () => {
					this.updatePreviousData(node, true, element);
				};
			} else {
				root.updateSnapshot = undefined;
			}
		};
	}

	private getDiffs(node: Node) {
		const diffs = new Array<
			| {
					kind: "textChange";
					node: Text;
					newText: string;
					parentElement: DocumentElement;
			  }
			| {
					kind: "childrenChange";
					node: Node;
					rootElement: DocumentElement;
			  }
		>();

		const traverse = (node: Node) => {
			const existing = this.nodeData.get(node);
			if (!existing) {
				// debugger;
				console.error("unexpected");
				return;
			}

			const current = this.createHistory(node);
			if (current.text !== existing.history.text) {
				diffs.push({
					kind: "textChange",
					node: node as Text,
					newText: current.text!,
					parentElement: existing.rootElement,
				});
			}

			let changed = false;
			if (existing.history.children.length !== current.children.length) {
				changed = true;
			}

			for (let i = 0; i < existing.history.children.length; i++) {
				const element = existing.history.children[i];
				const newElement = current.children[i];
				if (newElement !== element) {
					changed = true;
					break;
				}
				traverse(current.children[i]);
			}

			if (changed) {
				diffs.push({
					kind: "childrenChange",
					node: node,
					rootElement: existing.rootElement,
				});
			}
		};

		traverse(node);
		return diffs;
	}

	public applyDiffs() {
		const replacements = new Map<string, DocumentElement>();
		const elementsToRemount = new Set<DocumentElement>();

		const diffs = this.getDiffs(this.rootNode!);
		for (const diff of diffs) {
			if (diff.kind === "textChange") {
				replacements.set(
					diff.parentElement.id,
					(diff.parentElement as TextElement).with(diff.newText),
				);
			} else if (diff.kind === "childrenChange") {
				elementsToRemount.add(diff.rootElement);
			}
		}

		runInAction(() => {
			this.model.root = this.model.root.replace((e) =>
				replacements.get(e.id),
			) as ListElement;

			for (const elem of elementsToRemount) {
				this.invalidateElement(elem);
			}
		});
	}

	/*
	public ignoreSelectionChange = false;

	@action.bound
	handleSelectionChange() {
		if (this.ignoreSelectionChange) {
			return;
		}

		this.selection = this.getCurrentSelection();
		console.log(this.selection);
	}
*/
	/*
	getCurrentSelection(): ElementSelection | undefined {
		const sel = document.getSelection();
		if (!sel || sel.rangeCount === 0) {
			return undefined;
		}

		const range = sel.getRangeAt(0);
		const start = this.getElementPosFromDomNode({
			node: range.startContainer,
			offset: range.startOffset,
		});
		const end = this.getElementPosFromDomNode({
			node: range.endContainer,
			offset: range.endOffset,
		});
		if (!start) {
			return undefined;
		}
		return ElementSelection.from(start, end);
	}

	@observable selection: ElementSelection | undefined;

	setSelection(selection: ElementSelection | undefined) {
		const sel = document.getSelection();
		if (!sel) {
			return;
		}

		sel.removeAllRanges();

		if (!selection) {
			return;
		}

		const domStart = this.getDomFromElementPos(selection.start);
		if (!domStart) {
			return;
		}

		const r = new Range();
		if (domStart.offset !== undefined) {
			r.setStart(domStart.node, domStart.offset);
		} else {
			r.setStartAfter(domStart.node);
		}

		const domEnd = this.getDomFromElementPos(selection.end);
		if (domEnd) {
			if (domEnd.offset !== undefined) {
				r.setStart(domEnd.node, domEnd.offset);
			} else {
				r.setStartAfter(domEnd.node);
			}
		}

		sel.addRange(r);
	}*/

	rootNode: HTMLElement | null = null;
	@observable draggedElement: DocumentElement | undefined;
	@observable currentDropTargetPos: ElementPos | undefined;

	/*
	public getElementPosFromDomNode(domPos: {
		node: Node;
		offset?: number;
	}): ElementPos | undefined {
		const mapping = [...this.mapping].find(v => v.domNode === domPos.node);
		if (!mapping) {
			return undefined;
		}

		let offset: undefined | number = undefined;
		if (mapping.slice) {
			offset = mapping.slice.offset + (domPos.offset || 0);
		}

		return new ElementPos(mapping.element, offset);
	}

	public getDomFromElementPos(
		elementPos: ElementPos
	): { node: Node; offset?: number } | undefined {
		const mappings = [...this.mapping].filter(
			m => m.element === elementPos.element
		);

		for (const m of mappings) {
			if (!m.slice) {
				return { node: m.domNode };
			}
			if (!document.contains(m.domNode)) {
				continue;
			}
			if (
				elementPos.offset !== undefined &&
				elementPos.offset >= m.slice.offset
			) {
				return {
					node: m.domNode,
					offset: elementPos.offset - m.slice.offset,
				};
			}
		}
		return undefined;
	}

	@action
	insert(target: ElementPos, element: DocumentElement) {
		element.removeFromParent();
		const targetElem = target.element;
		if (targetElem.kind === "text") {
			const rest = targetElem.text.slice(target.offset);
			targetElem.text = targetElem.text.slice(0, target.offset);
			targetElem.parent!.insertAfter(targetElem, element);
			targetElem.parent!.insertAfter(element, new TextElement(rest));
		} else if (targetElem.kind === "list") {
			targetElem.insertAt(target.offset || 0, element);
		}
	}
	*/
}
