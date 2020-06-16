import {
	GemlMarkupStringDocument,
	GemlNode,
	parseGemlMarkupString,
} from "@hediet/geml";
import * as React from "react";
import { Fragment as Aux } from "react";
import { isFormattingInfo } from "./formatting";
import { Locale } from "./I18nService";
import { ReactI18nData } from "./react";
import {
	isTranslatable,
	Translatable,
	TranslatableI18nData,
} from "./Translatable";
import { tryMapAndReturnFirst } from "./utils";

export function evaluateTranslatableToReact(
	translatable: Translatable<ReactI18nData>,
	locale: Locale,
): React.ReactElement | null {
	const format = translatable.id
		? locale.getTranslatedFormat(
				translatable.id,
				translatable.defaultTranslation,
		  )
		: translatable.defaultTranslation;

	// We use `tryMapAndReturnFirst` so that invalid translations (syntactically or semantically) don't let the UI crash.
	// The default translation is used as fallback.
	return (
		tryMapAndReturnFirst(
			[format, translatable.defaultTranslation],
			(format) => (
				<>
					{evaluateGemlMarkupStringToReact(
						format,
						translatable.data || {},
						locale,
					)}
				</>
			),
		) || null
	);
}

function evaluateGemlMarkupStringToReact(
	gemlSrc: string,
	data: ReactI18nData,
	locale: Locale,
): React.ReactNode {
	const doc = CachingGemlParser.global.parseGemlMarkupString(gemlSrc);
	function toReact(node: GemlNode): React.ReactNode {
		switch (node.kind) {
			case "markupString":
			case "markupStringDocument": {
				if (node.content.nodes.length === 1) {
					// don't wrap content in <Aux> if not required.
					// This fixes the <option>{children}</option> bug,
					// since options calls toString on its children.
					return toReact(node.content.nodes[0]);
				}
				return node.content.nodes.map((n, idx) => (
					<Aux key={idx}>{toReact(n)}</Aux>
				));
			}
			case "markupStringPart": {
				return node.value;
			}
			case "object": {
				if (!node.type) {
					throw new Error();
				}
				const key = node.type.text;
				if (!(key in data)) {
					throw new Error(`No data for key "${key}" available!`);
				}
				const d = data[node.type.text];
				if (isTranslatable(d)) {
					return evaluateTranslatableToReact(d, locale);
				} else if (typeof d === "function") {
					const arg = node.getPositionalProperties()[0];
					if (!arg) {
						return d(null);
					}
					return d(toReact(arg.value));
				} else if (isFormattingInfo(d)) {
					const formatter = data[d.transformer];
					if (!formatter) {
						console.error(`formatter ${d.transformer} not found`);
						return "";
					}
					if (typeof formatter !== "function") {
						console.error(
							`formatter ${d.transformer} is not a React Component`,
						);
						return "";
					}
					// todo: allow recursion here by calling making FormattingInfo a geml ast subset or something
					return formatter(d.value as React.ReactNode);
				} else {
					return d as React.ReactNode;
				}
			}
		}
		throw new Error(`Unsupported geml node of kind "${node.kind}"`);
	}
	return toReact(doc);
}

export function evaluateTranslatableToString(
	translatable: Translatable,
	locale: Locale,
): string {
	const format = translatable.id
		? locale.getTranslatedFormat(
				translatable.id,
				translatable.defaultTranslation,
		  )
		: translatable.defaultTranslation;

	// We use `tryMapAndReturnFirst` so that invalid translations (syntactically or semantically) don't let the UI crash.
	// The default translation is used as fallback.
	return (
		tryMapAndReturnFirst(
			[format, translatable.defaultTranslation],
			(format) =>
				evaluateGemlMarkupStringToString(
					format,
					translatable.data || {},
					locale,
				),
		) || ""
	);
}

function evaluateGemlMarkupStringToString(
	gemlSrc: string,
	data: TranslatableI18nData,
	locale: Locale,
): string {
	const doc = CachingGemlParser.global.parseGemlMarkupString(gemlSrc);
	function toString(node: GemlNode): string {
		switch (node.kind) {
			case "markupString":
			case "markupStringDocument": {
				return node.content.nodes.map((n) => toString(n)).join("");
			}
			case "markupStringPart": {
				return node.value;
			}
			case "object": {
				if (!node.type) {
					throw new Error();
				}
				const key = node.type.text;
				if (!(key in data)) {
					throw new Error(`No data for key "${key}" available!`);
				}
				const d = data[node.type.text];
				if (isTranslatable(d)) {
					return evaluateTranslatableToString(d, locale);
				}
				return `${String(d)}`;
			}
		}
		throw new Error(`Unsupported geml node of kind "${node.kind}"`);
	}
	return toString(doc);
}

class CachingGemlParser {
	public static readonly global = new CachingGemlParser();

	private readonly documentsBySrc = new Map<
		string,
		GemlMarkupStringDocument
	>();

	public parseGemlMarkupString(gemlSrc: string): GemlMarkupStringDocument {
		let doc = this.documentsBySrc.get(gemlSrc);
		if (!doc) {
			doc = parseGemlMarkupString(gemlSrc);
			this.documentsBySrc.set(gemlSrc, doc);
		}
		return doc;
	}
}
