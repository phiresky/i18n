import * as nanoid from "nanoid";
import { Entity, ManyToOne, PrimaryColumn, Relation } from "typeorm";
import { UserEntity } from "./UserEntity.js";

@Entity("tokens")
export class TokenEntity {
	private static newTokenId = nanoid.customAlphabet(
		"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
		20,
	);

	public static create(owningUser: UserEntity): TokenEntity {
		const u = new TokenEntity();
		u.id = TokenEntity.newTokenId();
		u.owningUser = owningUser;
		return u;
	}

	@PrimaryColumn({ type: "varchar" })
	id!: string;

	@ManyToOne((type) => UserEntity, (user) => user.tokens, {
		onDelete: "CASCADE",
	})
	owningUser!: Relation<UserEntity>;
}
