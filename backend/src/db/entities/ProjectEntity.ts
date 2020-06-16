import {
	Column,
	Entity,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	Unique,
} from "typeorm";
import { OrganizationEntity } from "./OrganizationEntity.js";
import { VersionEntity } from "./VersionEntity.js";

@Entity("project")
@Unique(["projectId", "owningOrg"])
export class ProjectEntity {
	public static create(
		org: OrganizationEntity,
		projectId: string,
	): ProjectEntity {
		const o = new ProjectEntity();
		o.owningOrg = org;
		o.projectId = projectId;
		return o;
	}

	@PrimaryGeneratedColumn({ type: "integer" })
	id!: number;

	@Column({ type: "varchar" })
	projectId!: string;

	@ManyToOne((type) => OrganizationEntity, (user) => user.projects, {
		onDelete: "CASCADE",
	})
	owningOrg!: OrganizationEntity;

	@OneToMany((type) => VersionEntity, (version) => version.owningProject)
	versions!: ProjectEntity[];
}
