import { observer } from "mobx-react";
import * as React from "react";
import { I18nService, I18nServiceConfig } from "./I18nService";

import { useContext } from "react";
import {
	evaluateTranslatableToReact,
	evaluateTranslatableToString,
} from "./geml-evaluation";
import { TranslatableI18nData, TranslatableI18nValue } from "./Translatable";

const GlobalI18nDataElements = React.createContext<ReactI18nData>({});
export const GlobalI18nService = React.createContext<I18nService>(null!);

export const I18nLoader: React.FC<{
	children: React.ReactNode;
	globalFormatters?: ReactI18nData;
	timeoutInMs: number;
	serviceConfig: I18nServiceConfig;
}> = observer((props) => {
	const i18nService = React.useMemo(() => {
		return new I18nService(props.serviceConfig);
	}, [props.serviceConfig]);
	if (i18nService.initialized.state === "pending") {
		return <></>;
	}
	for (const k in props.globalFormatters) {
		if (k[0].toUpperCase() !== k[0]) {
			console.warn(
				`global i18n keys should start with an upper case leter (got ${k})`,
			);
		}
	}
	// todo: allow nesting of GlobalI18nDataElements.Provider
	return (
		<GlobalI18nDataElements.Provider value={props.globalFormatters || {}}>
			<GlobalI18nService.Provider value={i18nService}>
				{props.children}
			</GlobalI18nService.Provider>
		</GlobalI18nDataElements.Provider>
	);
});

type ReactI18nDataHandler = (body: React.ReactNode) => React.ReactElement;
export type ReactI18nData = Record<
	string,
	| TranslatableI18nValue
	| React.ReactElement
	| ReactI18nDataHandler
	| React.Component<any>
	| React.FunctionComponent<any>
>;

/**
 * Renders a translation. Best way to localize messages. Example:
 *
 * ```tsx
 * <TransMsg
 * 	default={"You have {bold <{count} messages>}"}
 * 	data={{ count: 10, bold: (body) => <b>{body}</b> }}
 * 	id="vjy1Ilf0"
 * />;
 * ```
 */
export const TransMsg: React.FC<{
	/**
	 * The default translation. Uses GeMl syntax (see https://geml.dev). Must be
	 * a static string.
	 */
	default: string;
	data?: ReactI18nData;
	/**
	 * A static description of this translatable for the translator. Is not used
	 * at runtime. Only set a description if `default` needs more context.
	 */
	description?: string;
	/**
	 * The id of this translation. All translatables with the same id must use
	 * the same default. Must be a static string.
	 */
	id: string;
}> = observer((props) => {
	const globalData = useContext(GlobalI18nDataElements);
	const i18nService = useContext(GlobalI18nService);
	return evaluateTranslatableToReact(
		{
			id: props.id,
			defaultTranslation: props.default,
			data: { ...globalData, ...props.data },
		},
		i18nService.currentLocale,
	);
});
/** Translates a message to a string. */
export function transStr(
	/** The default translation. Uses GeMl syntax. Must be a static string. */
	defaultTranslation: string,
	options: {
		/**
		 * A static description of this translatable for the translator. Is not
		 * used at runtime. Only set a description if `default` needs more
		 * context.
		 */
		description?: string;

		data?: TranslatableI18nData;

		/**
		 * The id of this translatable. All translatables with the same id must
		 * use the same default. Must be a static string.
		 */
		id: string;
		i18nService: I18nService;
	},
): string {
	return evaluateTranslatableToString(
		{ id: options.id, defaultTranslation, data: options.data },
		options.i18nService.currentLocale,
	);
}
