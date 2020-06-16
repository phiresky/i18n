import { Checkbox } from "@blueprintjs/core";
import { observer } from "mobx-react";
import * as React from "react";
import { Flag } from "../../../../../common/Flag";
import { Model } from "../../../../model";
import { TranslationEntry } from "./TranslationEntry";

@observer
export class TranslationPage extends React.Component<{ model: Model }> {
	override render() {
		const { model } = this.props;
		const lang = model.settings.languageCode!;
		return (
			<div>
				<div style={{ height: 8 }} />
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
					}}
				>
					<Checkbox
						style={{ margin: 0 }}
						label="Show Translatable Markers"
						checked={model.showTranslatableMarkers}
						onChange={(e) =>
							(model.showTranslatableMarkers =
								e.currentTarget.checked)
						}
					/>

					<div style={{ marginLeft: "auto" }} />
					<Flag languageCode={lang} />
					<div style={{ width: 8 }} />
					{lang}
				</div>
				<div style={{ height: 8 }} />
				<TranslationView model={model} />
			</div>
		);
	}
}

const TranslationView = observer((props: { model: Model }) => {
	const { model } = props;

	if (!model.selectedVisibleTranslation) {
		return null;
	}

	const translations = model.translations.get();
	if (translations.kind !== "loaded") {
		return <div>Loading</div>;
	}

	const lang = translations.value.getLanguage(model.settings.languageCode!);
	const defaultTranslation =
		translations.value.defaultLanguage.getTranslation(
			model.selectedVisibleTranslation.codeId,
		);

	if (!defaultTranslation) {
		return (
			<>
				Translatable "{model.selectedVisibleTranslation.codeId}" has not
				been synchronized with the database yet!
			</>
		);
	}

	return (
		<>
			<h3>{defaultTranslation.translatedFormat}</h3>
			<div style={{ height: 8 }} />
			<TranslationEntry
				model={model}
				translatable={{
					translatableId: defaultTranslation.translatableId,
					codeId: defaultTranslation.codeId,
				}}
				lang={lang}
			/>
		</>
	);
});
