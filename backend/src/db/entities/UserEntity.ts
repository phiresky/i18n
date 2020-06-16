import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { OrganizationMembershipEntity } from "./OrganizationMembershipEntity.js";
import { TokenEntity } from "./TokenEntity.js";

@Entity("users")
export class UserEntity {
	public static create(
		email: string,
		passwordHash: string,
		memberships: OrganizationMembershipEntity[],
	): UserEntity {
		const u = new UserEntity();
		u.email = email;
		u.memberships = memberships;
		u.passwordHash = passwordHash;
		return u;
	}

	@PrimaryGeneratedColumn({ type: "integer" })
	id!: number;

	@Column({ type: "varchar", unique: true })
	email!: string;

	@Column({ type: "varchar" })
	passwordHash!: string;

	// lowercase
	@Column({ type: "varchar", unique: true })
	username!: string;

	@Column({ type: "boolean", default: false })
	isSiteAdmin!: boolean;

	@OneToMany(
		(type) => OrganizationMembershipEntity,
		(membership) => membership.user,
	)
	memberships!: OrganizationMembershipEntity[];

	@OneToMany((type) => TokenEntity, (token) => token.owningUser)
	tokens!: TokenEntity[];
}
