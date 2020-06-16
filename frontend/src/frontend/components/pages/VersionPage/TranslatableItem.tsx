import { Card, Elevation } from "@blueprintjs/core";
import { observer } from "mobx-react";
import * as React from "react";
import { TranslationEntry } from "./TranslationEntry";
import { TranslatablesWithTranslations } from "./VersionPage";
import { StateFilter, VersionPageModel } from "./VersionPageModel";

@observer
export class TranslatableItem extends React.Component<{
	translatable: TranslatablesWithTranslations["translatables"][0];
	defaultLanguageCode: string;
	versionPageModel: VersionPageModel;
}> {
	override render() {
		const { translatable, versionPageModel, defaultLanguageCode } =
			this.props;
		const defaultTranslation = translatable.translations.find(
			(t) => t.languageCode === defaultLanguageCode,
		);
		if (!defaultTranslation) {
			return <div>Error: No default translation set</div>;
		}
		return (
			<Card
				className="part-card"
				elevation={Elevation.ONE}
				style={{ paddingTop: 10, marginBottom: 10 }}
			>
				<div
					className="part-info"
					style={{
						display: "flex",
						flexDirection: "column",
					}}
				>
					<div>
						<div
							style={{
								display: "flex",
								flexWrap: "wrap-reverse",
							}}
						>
							<h3
								className="bp5-heading"
								style={{ marginTop: 0 }}
							>
								{defaultTranslation.translatedFormat}
							</h3>

							<div style={{ marginLeft: "auto" }}>
								{translatable.codeId}
							</div>
						</div>
					</div>
					{translatable.description && (
						<h5
							className="bp5-heading"
							style={{ marginTop: 0, fontStyle: "italic" }}
						>
							Description: {translatable.description}
						</h5>
					)}
					{translatable.translations
						.filter(
							(t) =>
								versionPageModel.shouldShowLanguageCode(
									t.languageCode,
								) &&
								(versionPageModel.stateFilter !==
									StateFilter.translated ||
									t.translatedFormat !== null) &&
								(versionPageModel.stateFilter !==
									StateFilter.untranslated ||
									t.translatedFormat === null),
						)
						.map((translation) => (
							<React.Fragment key={translation.languageCode}>
								<div>
									<TranslationEntry
										versionPageModel={versionPageModel}
										translatable={translatable}
										translation={translation}
									/>
								</div>
								<div style={{ height: 10 }} />
							</React.Fragment>
						))}
				</div>
			</Card>
		);
	}
}
