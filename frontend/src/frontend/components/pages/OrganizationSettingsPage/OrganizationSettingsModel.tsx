import { action, computed, makeObservable, observable } from "mobx";
import { fromPromise } from "mobx-utils";
import { pendingPromise } from "../../../../common/pendingPromise";
import { Model } from "../../../model";
import { NewMemberDialog } from "./NewMemberDialog";
import * as React from "react";

export class OrganizationSettingsModel {
	@observable cacheKey = 0;
	@computed get data() {
		this.cacheKey;
		const client = this.parentModel.internalClient;
		return fromPromise(
			client
				? client.mainApi.getOrgMemberships({ orgId: this.orgId })
				: pendingPromise,
		);
	}

	constructor(
		public readonly parentModel: Model,
		public readonly orgId: string,
	) {
		makeObservable(this);
	}

	public async setAdmin(userId: number, isAdmin: boolean): Promise<void> {
		await this.parentModel.internalClient!.mainApi.updateOrgMembership({
			orgId: this.orgId,
			user: { userId },
			state: isAdmin ? "admin" : "member",
		});
		this.cacheKey++;
	}

	public async removeMember(userId: number): Promise<void> {
		await this.parentModel.internalClient!.mainApi.updateOrgMembership({
			orgId: this.orgId,
			user: { userId },
			state: "none",
		});
		this.cacheKey++;
	}

	@action.bound
	public showAddMemberDialog(): void {
		this.parentModel.dialog.show(
			<NewMemberDialog
				onCancel={() => {
					this.parentModel.dialog.close();
				}}
				onSubmit={async ({ username }) => {
					await this.parentModel.internalClient!.mainApi.updateOrgMembership(
						{
							orgId: this.orgId,
							user: { username },
							state: "member",
						},
					);
					this.cacheKey++;
					this.parentModel.dialog.close();
				}}
			/>,
		);
	}
}
