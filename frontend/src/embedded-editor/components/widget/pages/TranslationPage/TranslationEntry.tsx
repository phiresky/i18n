import { Button, InputGroup, Spinner, SpinnerSize } from "@blueprintjs/core";
import { action, autorun, makeObservable, observable } from "mobx";
import { disposeOnUnmount, observer } from "mobx-react";
import * as React from "react";
import { Model } from "../../../../model";
import { TranslatedLang } from "../../../../model/Translations";

@observer
export class TranslationEntry extends React.Component<{
	model: Model;
	lang: TranslatedLang;
	translatable: {
		translatableId: number;
		codeId: string;
	};
}> {
	@observable updating = false;
	private readonly ref = React.createRef<HTMLInputElement>();

	constructor(props: {
		model: Model;
		lang: TranslatedLang;
		translatable: {
			translatableId: number;
			codeId: string;
		};
	}) {
		super(props);
		makeObservable(this);
	}

	private get trans() {
		return this.props.lang.getTranslation(this.props.translatable.codeId)!;
	}

	get format(): string | null {
		return this.trans.translatedFormat;
	}

	@action
	private setFormat(format: string | null) {
		this.trans.translatedFormat = format;
	}

	@action.bound
	private async resetFormat() {
		this.setFormat(null);
		await this.updateFormat();
	}

	private async updateFormat() {
		this.updating = true;
		try {
			await this.props.lang.setTranslation(
				this.props.translatable.translatableId,
				this.format,
			);
		} finally {
			setTimeout(() => {
				this.updating = false;
			}, 200);
		}
	}

	@disposeOnUnmount
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	private readonly r = autorun(() => {
		this.props.model.selectedVisibleTranslation;
		if (this.ref.current) {
			this.ref.current.focus();
		}
	});

	override render() {
		return (
			<div
				style={{
					display: "flex",
					alignItems: "center",
				}}
			>
				<div style={{ width: 8 }} />
				<div style={{ flex: 1 }}>
					<InputGroup
						inputRef={this.ref}
						value={this.format || ""}
						intent={this.format === null ? "danger" : "none"}
						placeholder={
							this.format === null
								? "Set Translation..."
								: undefined
						}
						onChange={(v) => this.setFormat(v.target.value)}
						onBlur={() => void this.updateFormat()}
						onKeyDown={(evt) => {
							if (evt.keyCode === 13) {
								// enter
								void this.updateFormat();
							}
						}}
						rightElement={
							<>
								{this.updating ? (
									<Spinner size={SpinnerSize.STANDARD} />
								) : (
									<Button
										icon="delete"
										disabled={this.format === null}
										minimal
										onClick={() => void this.resetFormat()}
									/>
								)}
							</>
						}
					/>
				</div>
			</div>
		);
	}
}
