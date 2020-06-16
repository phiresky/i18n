import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { ProjectEntity } from "./ProjectEntity.js";
import { OrganizationMembershipEntity } from "./OrganizationMembershipEntity.js";

@Entity("organization")
export class OrganizationEntity {
	@PrimaryGeneratedColumn({ type: "integer" })
	id!: number;

	@Column({ type: "varchar", unique: true })
	orgId!: string;

	@OneToMany(
		(type) => OrganizationMembershipEntity,
		(membership) => membership.org,
	)
	memberships!: OrganizationMembershipEntity[];

	@OneToMany((type) => ProjectEntity, (membership) => membership.owningOrg)
	projects!: ProjectEntity[];
}
