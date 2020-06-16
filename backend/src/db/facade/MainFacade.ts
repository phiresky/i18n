import { sOrgOverview } from "@hediet/i18n-api";
import { In } from "typeorm";
import {
	OrganizationMembershipEntity,
	ProjectEntity,
	VersionEntity,
} from "../entities/index.js";
import { BaseFacade } from "./BaseFacade.js";
import { Session } from "./UserManagementFacade.js";

export class MainFacade extends BaseFacade {
	public async getOrganizations(
		session: Session | "admin",
	): Promise<(typeof sOrgOverview.T)[]> {
		const q =
			this.connection.organizations.createQueryBuilder("organization");
		q.leftJoinAndSelect(
			"organization.projects",
			"project",
			"project.owningOrg = organization.id",
		);
		if (session !== "admin") {
			q.innerJoinAndSelect(
				"organization.memberships",
				"membership",
				"membership.userId = :userId",
				{ userId: session.userId },
			);
		}
		const orgs = await q.getMany();

		return orgs.map((o) => ({
			orgId: o.orgId,
			isAdmin: session === "admin" || o.memberships[0].isAdmin,
			projects: o.projects.map((p) => ({
				projectId: p.projectId,
			})),
		}));
	}

	public async getOrganizationMembershipInfo(
		userId: number,
		orgId: string,
	): Promise<{ isAdmin: boolean } | undefined> {
		const membership =
			await this.connection.organizationMemberships.findOne({
				where: { org: { orgId: orgId }, user: { id: userId } },
			});
		if (membership) {
			return {
				isAdmin: membership.isAdmin,
			};
		}
		return undefined;
	}

	public async getOrganizationMemberships(
		orgId: string,
	): Promise<{ userId: number; username: string; isAdmin: boolean }[]> {
		const org = await this.getOrg(
			{ orgId },
			{
				join: {
					alias: "org",
					leftJoinAndSelect: {
						member: "org.memberships",
						user: "member.user",
					},
				},
			},
		);
		if ("error" in org) {
			throw org;
		}
		return org.memberships.map((m) => ({
			userId: m.user.id,
			isAdmin: m.isAdmin,
			username: m.user.username,
		}));
	}

	public async findUserIdByUsername(
		username: string,
	): Promise<{ userId: number }> {
		const userEntity = await this.connection.users.findOneByOrFail({
			username,
		});
		return { userId: userEntity.id };
	}

	public async updateOrgMembership(
		orgId: string,
		userId: number,
		state: "none" | "member" | "admin",
	): Promise<void> {
		const org = await this.getOrg({ orgId });
		if ("error" in org) {
			throw new Error();
		}
		let membership =
			await this.connection.organizationMemberships.findOneBy({
				org,
				user: { id: userId },
			});

		if (state === "none") {
			if (membership) {
				await this.connection.organizationMemberships.delete(
					membership,
				);
			}
		} else {
			if (!membership) {
				membership = new OrganizationMembershipEntity();
				membership.user = this.connection.users.create({ id: userId });
				membership.org = org;
			}
			membership.isAdmin = state === "admin";
			await this.connection.organizationMemberships.save(membership);
		}
	}

	public async deleteOrg(orgId: string): Promise<void> {
		await this.connection.organizations.delete({ orgId });
	}

	public async createOrg(details: {
		orgId: string;
		admins: string[];
	}): Promise<void> {
		console.log("admins", details.admins);

		const org = this.connection.organizations.create({
			orgId: details.orgId,
			memberships: [],
		});
		const admins = await this.connection.users.findBy({
			username: In(details.admins),
		});
		console.log("admins", admins);
		if (admins.length !== details.admins.length) {
			throw Error("Could not find all given users");
		}

		await this.connection.organizations.save(org, { reload: true });
		for (const admin of admins) {
			org.memberships.push(
				this.connection.organizationMemberships.create({
					org,
					isAdmin: true,
					user: admin,
				}),
			);
		}
		await this.connection.organizationMemberships.save(org.memberships);
	}

	public async createProject(details: {
		orgId: string;
		projectId: string;
	}): Promise<{ project: ProjectEntity; version: VersionEntity }> {
		const org = await this.connection.organizations.findOneByOrFail({
			orgId: details.orgId,
		});
		const project = this.connection.projects.create({
			owningOrg: org,
			projectId: details.projectId,
		});
		await this.connection.projects.save(project);
		const version = this.connection.versions.create({
			owningProject: project,
			iteration: 1,
			label: "main",
			locked: false,
		});
		await this.connection.versions.save(version);
		return { project, version };
	}

	public async postProject(
		context: { orgId: string },
		details: { projectId: string },
	): Promise<undefined | { error: "orgNotFound" }> {
		const org = await this.getOrg(context);
		if ("error" in org) {
			return org;
		}
		await this.connection.projects.save({
			owningOrg: org,
			projectId: details.projectId,
		});
		return undefined;
	}
}
