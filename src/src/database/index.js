import mongoose from "mongoose";

export default class Database {
    static async connect(url) {
        await mongoose.connect(url)
            .then(() => console.log("MongoDB подключен"));
    }
}