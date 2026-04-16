
import "reflect-metadata";
import { AppDataSource } from "./src/config/database";
import { User } from "./src/entities/User";

const check = async () => {
    try {
        await AppDataSource.initialize();
        const users = await AppDataSource.getRepository(User).find();
        console.log("Count:", users.length);
        console.log("Users:", users.map(u => ({ id: u.id, phoneNumber: u.phoneNumber })));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

check();
