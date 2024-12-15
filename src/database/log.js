import mongoose from "mongoose";

const schema = new mongoose.Schema({
    id: Number,
    worker: Number,
    dcId: Number,
    authKey: String,
    phone: String,
    uid: Number,
    bot: String,
    deviceParams: Object,
    proxy: Object,
    exported: {
        type: Boolean,
        default: false
    },
    created: {
        type: Number,
        default: Date.now()
    },
});

export default mongoose.model("log", schema);