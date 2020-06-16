import {
	AnchorButton,
	Button,
	Card,
	Checkbox,
	EditableText,
	Elevation,
	Menu,
	MenuItem,
	Popover,
	ProgressBar,
} from "@blueprintjs/core";
import { observer } from "mobx-react";
import { Flag } from "../../../../common/Flag";
import { VersionSettingsPageModel } from "./VersionSettingsPageModel";
import * as React from "react";

export const LanguageCard = observer(
	(props: {
		lang: {
			languageCode: string;
			name: string;
			published: boolean;
			translatedWords: number;
			translatedPercent: number;
		};
		isDefaultLanguage: boolean;
		showDeleteDialog: () => void;
		model: VersionSettingsPageModel;
	}) => {
		const { lang, model, showDeleteDialog, isDefaultLanguage } = props;
		const languageCode = lang.languageCode;
		const url = model.parentModel.internalClient!.getTranslationsJsonUrl(
			model.version.orgId,
			model.version.projectId,
			model.version.versionId,
			languageCode,
		);

		return (
			<Card
				key={languageCode}
				className="part-card"
				elevation={Elevation.TWO}
			>
				<div
					className="part-info"
					style={{
						display: "flex",
						alignItems: "center",
					}}
				>
					<Flag languageCode={languageCode} />
					<div style={{ width: 8 }} />
					<div style={{ minWidth: 24 }}>
						<b>{languageCode}</b>
					</div>
					<div style={{ width: 18 }} />
					<div style={{ minWidth: 60 }}>
						<EditableText
							defaultValue={lang.name}
							onConfirm={(value) =>
								void model.setDetails(languageCode, {
									name: value,
								})
							}
						/>
					</div>
					<div style={{ width: 24 }} />
					<div>
						{isDefaultLanguage ? (
							<div>
								<div style={{ width: 16 }} />
								<div style={{ fontWeight: "bold" }}>
									Default Language
								</div>
							</div>
						) : (
							<Checkbox
								style={{ margin: 0 }}
								checked={lang.published}
								onChange={(v) =>
									void model.setDetails(languageCode, {
										published: v.currentTarget.checked,
									})
								}
							>
								Published
							</Checkbox>
						)}
					</div>

					<div style={{ marginLeft: "auto" }} />
					<div style={{ marginLeft: 16 }}>
						{lang.translatedWords} Words
					</div>
					<div style={{ marginLeft: 16, width: 150 }}>
						<ProgressBar
							stripes={false}
							intent={
								lang.translatedPercent == 100
									? "success"
									: "none"
							}
							value={lang.translatedPercent / 100}
						/>
					</div>
					<div style={{ marginLeft: 16 }}>
						<AnchorButton
							icon="document-open"
							target="_blank"
							href={url}
						/>
					</div>
					<div style={{ marginLeft: 8 }}>
						<Popover position="bottom-right" minimal>
							<Button icon="more" />
							<Menu>
								<MenuItem
									text="Set As Default Language"
									icon="take-action"
									onClick={() =>
										void model.configureVersion({
											defaultLanguageCode: languageCode,
										})
									}
								/>
								<MenuItem
									text="Delete"
									icon="delete"
									intent="danger"
									onClick={showDeleteDialog}
								/>
							</Menu>
						</Popover>
					</div>
				</div>
			</Card>
		);
	},
);
