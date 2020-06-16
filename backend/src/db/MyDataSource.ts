import { join } from "path";
import { DataSource } from "typeorm";
import { DbConnector } from "./DbConnector.js";

export default new DataSource(
	DbConnector.getConfig(join(__dirname, "./../../dev/data.db")),
);
