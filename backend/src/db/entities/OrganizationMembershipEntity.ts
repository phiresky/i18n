import {
	Entity,
	PrimaryGeneratedColumn,
	ManyToOne,
	Column,
	Unique,
} from "typeorm";
import { UserEntity } from "./UserEntity.js";
import { OrganizationEntity } from "./OrganizationEntity.js";

@Unique(["user", "org"])
@Entity("organization_memberships")
export class OrganizationMembershipEntity {
	public static create(
		org: OrganizationEntity,
		user: UserEntity,
		isAdmin: boolean,
	): OrganizationMembershipEntity {
		const o = new OrganizationMembershipEntity();
		o.org = org;
		o.user = user;
		o.isAdmin = isAdmin;
		return o;
	}

	@PrimaryGeneratedColumn({ type: "integer" })
	id!: number;

	@ManyToOne((type) => UserEntity, (entity) => entity.memberships, {
		onDelete: "CASCADE",
	})
	user!: UserEntity;

	@Column({ type: "boolean" })
	isAdmin!: boolean;

	@ManyToOne((type) => OrganizationEntity, (entity) => entity.memberships, {
		onDelete: "CASCADE",
	})
	org!: OrganizationEntity;
}
