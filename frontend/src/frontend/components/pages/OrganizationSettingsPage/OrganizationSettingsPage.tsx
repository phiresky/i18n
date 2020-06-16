import { Button } from "@blueprintjs/core";
import { observer } from "mobx-react";
import * as React from "react";
import { Model } from "../../../model";
import { PageLayout } from "../../PageLayout";
import { orgSettingsRoute } from "../../router";
import { MemberCard } from "./MemberCard";
import { OrganizationSettingsModel } from "./OrganizationSettingsModel";

@observer
export class OrganizationSettingsPage extends React.Component<
	{ model: Model; orgId: string },
	{}
> {
	private readonly model = new OrganizationSettingsModel(
		this.props.model,
		this.props.orgId,
	);

	override render() {
		const { model, orgId } = this.props;

		return (
			<PageLayout
				model={model}
				breadcrumbs={[
					{ icon: "cube", text: orgId },
					{
						targetLocation: orgSettingsRoute.build({
							orgId: orgId,
						}),
						icon: "cog",
						text: "Settings",
					},
				]}
			>
				<div className="component-ProjectPage">
					<h1 className="bp5-heading" style={{ paddingBottom: 16 }}>
						Organization {orgId}
					</h1>
					<div style={{ display: "flex", alignItems: "center" }}>
						<h2 className="bp5-heading">Members</h2>
						<div style={{ marginLeft: "auto", marginRight: 20 }}>
							<Button
								icon="plus"
								intent="success"
								onClick={this.model.showAddMemberDialog}
							/>
						</div>
					</div>

					{this.model.data
						.case({
							fulfilled: (v) => v.members,
							pending: (v) => [],
							rejected: (v) => [],
						})
						.map((v) => (
							<MemberCard
								model={this.model}
								memberInfo={v}
								key={v.userId}
							/>
						))}
				</div>
			</PageLayout>
		);
	}
}
