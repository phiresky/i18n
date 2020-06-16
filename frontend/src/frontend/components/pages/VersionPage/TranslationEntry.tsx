import {
	Button,
	InputGroup,
	Spinner,
	SpinnerSize,
	TextArea,
} from "@blueprintjs/core";
import { action, flow, makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { Flag } from "../../../../common/Flag";
import { VersionPageModel } from "./VersionPageModel";

@observer
export class TranslationEntry extends React.Component<{
	versionPageModel: VersionPageModel;
	translatable: { translatableId: number };
	translation: { languageCode: string; translatedFormat: string | null };
}> {
	@observable updating = false;
	@observable editedFormat: string | null | undefined = undefined;

	constructor(p: TranslationEntry["props"]) {
		super(p);

		makeObservable(this);
	}

	get format(): string | null {
		if (this.editedFormat !== undefined) {
			return this.editedFormat;
		}
		return this.props.translation.translatedFormat;
	}

	@action.bound
	private resetFormat() {
		this.editedFormat = null;
		this.updateFormat();
	}

	@flow
	private *updateFormat() {
		const model = this.props.versionPageModel.model;
		const versionRef = this.props.versionPageModel.version;

		if (!model.internalClient) {
			return;
		}

		if (this.editedFormat === undefined) {
			return;
		}
		this.updating = true;

		yield model.internalClient.versionApi.postTranslation({
			version: versionRef,
			languageCode: this.props.translation.languageCode,
			translatableId: this.props.translatable.translatableId,
			translatedFormat: this.editedFormat,
		});
		this.props.translation.translatedFormat = this.editedFormat;

		this.editedFormat = undefined;
		this.updating = false;
	}

	override render() {
		const { translation } = this.props;
		return (
			<div
				style={{
					display: "flex",
					alignItems: "center",
				}}
			>
				<Flag languageCode={translation.languageCode} />
				<div style={{ width: 8 }} />
				<div style={{ width: 50 }}>{translation.languageCode}</div>
				<div style={{ flex: 1 }}>
					{false ? (
						<TextArea
							growVertically
							fill
							value={this.format || ""}
							intent={this.format === null ? "danger" : "none"}
							placeholder={
								this.format === null
									? "Set Translation..."
									: undefined
							}
							onChange={(v) =>
								(this.editedFormat = v.target.value)
							}
						/>
					) : (
						<InputGroup
							value={this.format || ""}
							intent={this.format === null ? "danger" : "none"}
							placeholder={
								this.format === null
									? "Set Translation..."
									: undefined
							}
							onChange={(v) =>
								(this.editedFormat = v.target.value)
							}
							onBlur={() => this.updateFormat()}
							onKeyDown={(evt) => {
								if (evt.keyCode === 13) {
									// enter
									this.updateFormat();
								}
							}}
							rightElement={
								<>
									{this.updating ? (
										<Spinner size={SpinnerSize.STANDARD} />
									) : undefined}
									<Button
										icon="delete"
										disabled={this.format === null}
										minimal
										onClick={this.resetFormat}
									/>
								</>
							}
						/>
					)}
				</div>
			</div>
		);
	}
}
