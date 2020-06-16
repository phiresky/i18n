import { compare, hash } from "bcrypt";
import { DbConnection } from "../DbConnector.js";
import { TokenEntity } from "../entities/TokenEntity.js";

export class UserManagementFacade {
	constructor(private readonly connection: DbConnection) {}

	public async createUser(details: {
		username: string;
		isSiteAdmin?: boolean;
		email: string;
		password: string;
	}): Promise<void> {
		const { username, password, email, isSiteAdmin } = details;
		const passwordHash = await hash(password, 10);
		await this.connection.users.save({
			username,
			email,
			passwordHash,
			isSiteAdmin,
		});
	}

	public async deleteUser(userId: number): Promise<void> {
		const user = await this.connection.users.findOneByOrFail({
			id: userId,
		});
		await this.connection.users.delete(user);
	}

	public async updateUser(
		userId: number,
		update: { isSiteAdmin?: boolean; password?: string },
	): Promise<void> {
		const user = await this.connection.users.findOneByOrFail({
			id: userId,
		});
		if (update.isSiteAdmin !== undefined) {
			user.isSiteAdmin = update.isSiteAdmin;
		}
		if (update.password !== undefined) {
			const passwordHash = await hash(update.password, 10);
			user.passwordHash = passwordHash;
		}

		await this.connection.users.save(user);
	}

	public async getUserInfo(userId: number): Promise<{
		id: number;
		username: string;
		email: string;
		isSiteAdmin: boolean;
	}> {
		const user = await this.connection.users.findOneByOrFail({
			id: userId,
		});
		return {
			id: user.id,
			username: user.username,
			email: user.email,
			isSiteAdmin: user.isSiteAdmin,
		};
	}

	public async listAllUsers(): Promise<
		{
			id: number;
			username: string;
			email: string;
			isSiteAdmin: boolean;
		}[]
	> {
		const users = await this.connection.users.find();
		return users.map((u) => ({
			id: u.id,
			username: u.username,
			email: u.email,
			isSiteAdmin: u.isSiteAdmin,
		}));
	}

	public async setPassword(
		userId: number,
		newPassword: string,
	): Promise<void> {
		const user = await this.connection.users.findOneByOrFail({
			id: userId,
		});

		const passwordHash = await hash(newPassword, 10);
		user.passwordHash = passwordHash;
		await this.connection.users.save(user);
	}

	public async checkPassword(
		userId: number,
		password: string,
	): Promise<boolean> {
		const user = await this.connection.users.findOneByOrFail({
			id: userId,
		});

		const isPasswordValid = await compare(password, user.passwordHash);
		return isPasswordValid;
	}

	public async createSession(
		usernameOrEmail: string,
		password: string,
	): Promise<Session> {
		const user = await this.connection.users.findOne({
			where: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
		});
		if (!user) {
			throw new Error("User does not exist");
		}

		const isPasswordValid = await compare(password, user.passwordHash);
		if (!isPasswordValid) {
			throw new Error("Invalid password");
		}

		const r = await this.connection.tokens.save(TokenEntity.create(user));
		return new Session(r.id, user.id);
	}

	public async getSession(tokenId: string): Promise<Session | undefined> {
		const tokenEntity = await this.connection.tokens.findOne({
			where: {
				id: tokenId,
			},
			relations: ["owningUser"],
		});

		if (!tokenEntity) {
			return undefined;
		}

		return new Session(tokenEntity.id, tokenEntity.owningUser.id);
	}

	public async deleteSession(tokenId: string): Promise<void> {
		await this.connection.tokens.delete({ id: tokenId });
	}

	public async deleteUserSessionsExcept(
		userId: number,
		sessionId: string,
	): Promise<void> {
		const user = await this.connection.users.findOneOrFail({
			where: { id: userId },
			relations: ["tokens"],
		});
		const tokensToDelete = user.tokens.filter((t) => t.id !== sessionId);
		await this.connection.tokens.remove(tokensToDelete);
	}

	public async ensureIsSiteAdmin(userId: number): Promise<void> {
		const user = await this.connection.users.findOneByOrFail({
			id: userId,
		});
		if (!user.isSiteAdmin) {
			throw new Error("User is not a site admin!");
		}
	}
}

export class Session {
	constructor(
		public readonly sessionId: string,
		public readonly userId: number,
	) {}
}
