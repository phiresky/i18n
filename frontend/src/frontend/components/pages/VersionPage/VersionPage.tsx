import {
	AnchorButton,
	Button,
	Callout,
	FormGroup,
	HTMLSelect,
} from "@blueprintjs/core";
import { sTranslatablesWithTranslations, sVersionRef } from "@hediet/i18n-api";
import { computed, makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { MeasuredDiv } from "../../../../common/hediet-super-scrollview/MeasuredDiv";
import { ResizeObserverWithEvents } from "../../../../common/hediet-super-scrollview/ResizeObserverWithEvents";
import {
	ItemWithHeight,
	SimpleItemProvider,
	SuperScrollView,
} from "../../../../common/hediet-super-scrollview/SuperScrollView";
import { InputGroupMobx } from "../../../../common/InputGroupMobx";
import { ref } from "../../../../embedded-editor/utils";
import { Model } from "../../../model";
import { CustomMultiSelect } from "../../CustomMultiSelect";
import { PageLayout } from "../../PageLayout";
import { projectRoute, versionRoute, versionSettingsRoute } from "../../router";
import { PackageHeaderItem } from "./PackageHeaderItem";
import { TranslatableItem } from "./TranslatableItem";
import { StateFilter, VersionPageModel } from "./VersionPageModel";

type VersionPageProps = {
	model: Model;
	version: (typeof sVersionRef)["T"];
};

@observer
export class VersionPage extends React.Component<VersionPageProps> {
	private readonly model = new VersionPageModel(
		this.props.model,
		this.props.version,
	);

	constructor(p: VersionPageProps) {
		super(p);

		makeObservable(this);
	}

	private matchesSearch(
		search: string,
		translatable: (typeof sTranslatablesWithTranslations.T)["translatables"][0],
	): boolean {
		if (translatable.codeId.toLowerCase().includes(search.toLowerCase())) {
			return true;
		}
		if (
			translatable.translations.some(
				(t) =>
					t.translatedFormat &&
					t.translatedFormat
						.toLocaleLowerCase()
						.includes(search.toLocaleLowerCase()),
			)
		) {
			return true;
		}
		return false;
	}

	@computed get items() {
		if (this.model.data.state !== "fulfilled") {
			return [];
		}
		let idx = 0;
		let headerIdx = 0;
		const search = this.model.search;
		const result = new Array<ItemWithHeight>();

		const translatablesGroupedByPackageId = groupBy(
			this.model.data.value.translatables,
			(t) => t.packageId,
		);

		for (const pkg of this.model.data.value.packages) {
			if (!this.model.shouldShowPackage(pkg.packageId)) {
				continue;
			}

			let hasItems = false;
			for (const translatable of translatablesGroupedByPackageId.get(
				pkg.packageId,
			)!) {
				if (
					search !== "" &&
					!this.matchesSearch(search, translatable)
				) {
					continue;
				}

				if (this.model.stateFilter === StateFilter.untranslated) {
					if (
						translatable.translations
							.filter((t) =>
								this.model.shouldShowLanguageCode(
									t.languageCode,
								),
							)
							.every((t) => t.translatedFormat !== null)
					) {
						continue;
					}
				} else if (this.model.stateFilter === StateFilter.translated) {
					if (
						translatable.translations
							.filter((t) =>
								this.model.shouldShowLanguageCode(
									t.languageCode,
								),
							)
							.every((t) => t.translatedFormat === null)
					) {
						continue;
					}
				}

				if (!hasItems) {
					const obj = observable({
						height: 100,
						id: `h-${headerIdx++}`,
						render: () => (
							<MeasuredDiv
								resizeObserver={this.r}
								onLayout={(l) => (obj.height = l.height)}
							>
								<PackageHeaderItem pkg={pkg} />
							</MeasuredDiv>
						),
					});
					result.push(obj);
				}
				hasItems = true;
				const obj = observable({
					height: 1000,
					id: `i-${idx++}`,
					render: () => (
						<MeasuredDiv
							resizeObserver={this.r}
							onLayout={(l) => (obj.height = l.height)}
						>
							<TranslatableItem
								versionPageModel={this.model}
								defaultLanguageCode={
									this.model.data.state === "fulfilled"
										? this.model.data.value
												.defaultLanguageCode
										: ""
								}
								translatable={translatable}
							/>
						</MeasuredDiv>
					),
				});
				result.push(obj);
			}
		}

		return result;
	}

	private readonly r = new ResizeObserverWithEvents();

	override render() {
		const { model, version } = this.props;

		if (this.model.data.state !== "fulfilled") {
			console.log(String(this.model.data.value));
		}

		return (
			<PageLayout
				model={model}
				breadcrumbs={[
					{ icon: "cube", text: version.orgId },
					{
						targetLocation: projectRoute.build(version),
						icon: "folder-close",
						text: version.projectId,
					},
					{
						targetLocation: versionRoute.build(version),
						icon: "box",
						text: version.versionId,
					},
				]}
				itemsNavBarRight={
					<AnchorButton
						{...model.routing.locationToOnClick(
							versionSettingsRoute.build({ ...version }),
						)}
						minimal
						icon={"cog"}
					/>
				}
			>
				<div
					className="component-VersionPage"
					style={{
						display: "flex",
						flexDirection: "column",
						height: "100%",
					}}
				>
					<div style={{ marginTop: "0px" }}>
						<Callout title="Filter">
							<div style={{ display: "flex" }}>
								<FormGroup
									label="Packages"
									style={{ marginRight: "10px" }}
								>
									<CustomMultiSelect<string>
										items={this.model.data
											.case({
												fulfilled: (v) => v.packages,
												pending: () => [],
												rejected: () => [],
											})
											.map((p) => p.packageId)}
										selectedItems={
											this.model.filteredPackageIds
										}
										nameFn={(e) => e}
									/>
								</FormGroup>
								<FormGroup label="Languages">
									<CustomMultiSelect<string>
										items={this.model.languages.map(
											(l) => l.languageCode,
										)}
										selectedItems={
											this.model.filteredLanguages
										}
										nameFn={(e) => e}
									/>
								</FormGroup>
								<div style={{ width: 10 }} />
								<FormGroup label="Search">
									<InputGroupMobx
										value={ref(this.model, "search")}
										placeholder="Search..."
									/>
								</FormGroup>
								<div style={{ width: 10 }} />
								<FormGroup label="State">
									<HTMLSelect
										onChange={(e) =>
											(this.model.stateFilter = e
												.currentTarget
												.value as VersionPageModel["stateFilter"])
										}
										options={[
											{
												value: StateFilter.all,
												label: "All",
											},
											{
												value: StateFilter.translated,
												label: "Only Translated",
											},
											{
												value: StateFilter.untranslated,
												label: "Only Untranslated",
											},
										]}
									/>
								</FormGroup>
								<div style={{ width: 10 }} />
								<FormGroup label=" ">
									<Button
										icon="translate"
										onClick={() =>
											this.model.suggestTranslations()
										}
										disabled={
											this.model.data.state !==
											"fulfilled"
										}
									>
										Suggest Translations
									</Button>
								</FormGroup>
								<div style={{ marginLeft: "auto" }} />
								<FormGroup label="Items">
									{
										this.items.filter((i) =>
											i.id.startsWith("i-"),
										).length
									}
								</FormGroup>
							</div>
						</Callout>
					</div>

					{this.items.length > 0 ? (
						<SuperScrollView
							style={{ flex: 1, minHeight: 0 }}
							innerStyle={{ padding: 10 }}
							itemProvider={new SimpleItemProvider(this.items)}
						/>
					) : (
						<div style={{ padding: 10 }}>
							<h3 className="bp5-heading">No Result</h3>
						</div>
					)}
				</div>
			</PageLayout>
		);
	}
}

export type TranslatablesWithTranslations =
	typeof sTranslatablesWithTranslations.T;

export function groupBy<T, TKey>(
	items: ReadonlyArray<T>,
	keySelector: (item: T) => TKey,
): Map<TKey, T[]> {
	const map = new Map<TKey, T[]>();
	for (const item of items) {
		const key = keySelector(item);
		let items = map.get(key);
		if (!items) {
			items = [];
			map.set(key, items);
		}
		items.push(item);
	}
	return map;
}
