import { DbConnection } from "../DbConnector.js";
import { OrganizationEntity } from "../entities/index.js";
import { FindOneOptions } from "typeorm";

export abstract class BaseFacade {
	constructor(protected readonly connection: DbConnection) {}

	protected async getOrg(
		context: {
			orgId: string;
		},
		options?: FindOneOptions<OrganizationEntity>,
	): Promise<OrganizationEntity | { error: "orgNotFound" }> {
		console.assert(!options || !("where" in options));
		const result = await this.connection.organizations.findOne({
			...options,
			where: { orgId: context.orgId },
		});
		if (result) {
			return result;
		} else {
			return { error: "orgNotFound" };
		}
	}
}
