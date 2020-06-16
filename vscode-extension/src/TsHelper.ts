import * as ts from "typescript";

export class TsHelper {
	public findNodeRangeThatContains(
		node: ts.Node,
		start: number,
		end: number,
	): ts.Node[] {
		const result = ts.forEachChild(
			node,
			(n) => {
				if (n.getStart() <= start && end <= n.getEnd()) {
					return this.findNodeRangeThatContains(n, start, end);
				}
				return undefined;
			},
			(arr) => {
				let startIdx = -1;
				let endIdx = -1;
				let i = 0;
				for (const n of arr) {
					if (n.getStart() <= start && end <= n.getEnd()) {
						return this.findNodeRangeThatContains(n, start, end);
					}

					if (n.getStart() <= start) {
						startIdx = i;
					}
					if (end <= n.getEnd()) {
						endIdx = i + 1;
						break;
					}

					i++;
				}
				if (startIdx !== -1 && endIdx !== -1) {
					return arr.slice(startIdx, endIdx);
				}
				return undefined;
			},
		);
		if (!result) {
			return [node];
		}
		return result;
	}

	public findParent<T extends ts.Node>(
		predicate: (p: ts.Node) => p is T,
		node: ts.Node,
	): T | undefined {
		if (predicate(node)) {
			return node;
		}
		if (node.parent) {
			return this.findParent(predicate, node.parent);
		}
		return undefined;
	}

	public getStringConcatenationParts(node: ts.Node):
		| {
				kind: "stringLiteralSequence";
				parts: (ts.Node | { kind: "stringPart"; text: string })[];
		  }
		| { kind: "node"; parts: [ts.Node] } {
		if (ts.isStringLiteral(node)) {
			return {
				kind: "stringLiteralSequence",
				parts: [{ kind: "stringPart", text: node.text }],
			};
		} else if (ts.isBinaryExpression(node)) {
			const p1 = this.getStringConcatenationParts(node.left);
			const p2 = this.getStringConcatenationParts(node.right);
			if (p1.kind === "node" && p2.kind === "node") {
				return { kind: "node", parts: [node] };
			}
			return {
				kind: "stringLiteralSequence",
				parts: new Array<
					ts.Node | { kind: "stringPart"; text: string }
				>().concat(p1.parts, p2.parts),
			};
		} else if (ts.isParenthesizedExpression(node)) {
			return this.getStringConcatenationParts(node.expression);
		}

		return { kind: "node", parts: [node] };
	}
}
