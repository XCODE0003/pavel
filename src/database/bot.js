import mongoose from "mongoose";

const schema = new mongoose.Schema({
    id: Number,
    owner: Number,
    template: Number,
    token: String,
    username: String,
    blocked: {
        type: Boolean,
        default: false
    },
    starts: {
        type: Number,
        default: 0
    }
});

export default mongoose.model("bot", schema);