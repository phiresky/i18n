import { join } from "path";
import { DbConnector } from "./db/DbConnector.js";
import { Facades } from "./db/facade/index.js";
import { HttpServer } from "./HttpServer.js";
import { WebsocketHandler } from "./websocketHandler.js";

/*
class Mail {
    private transporter = createTransport({
        host: "in-v3.mailjet.com",
        port: 587,
        secure: false,
        auth: {
            user: "b3ad1a609006cb795d48ca12ceee9d2d",
            pass: "546a2b21db02c50a08b0701ebc3c4c44",
        },
    });

    public async send(): Promise<void> {
        // send mail with defined transport object
        let info = await this.transporter.sendMail({
            from: '"I18n System" <info@bronnbacher.hediet.de>',
            to: "henning.dieterichs@live.de",
            subject: "Confirm Account",
            text: "Hello world?",
            html: "<b>Hello world?</b>",
        });
        console.log(info);
    }
}*/

class Main {
	constructor() {
		void this.run();
	}

	public async run(): Promise<void> {
		/*const m = new Mail();
        await m.send();*/

		const dbConnector = new DbConnector(
			join(__dirname, "../data/i18n-database.sqlite3"),
		);
		const dbConnection = await dbConnector.getConnection();
		console.log("started");

		const facades = new Facades(dbConnection);
		try {
			await facades.userManagement.createUser({
				username: "admin",
				password: "changeme",
				isSiteAdmin: true,
				email: "admin",
			});
		} catch (e) {
			/*
			 */
		}

		const websocketHandler = new WebsocketHandler(facades);
		new HttpServer(websocketHandler, facades);
	}
}

new Main();
