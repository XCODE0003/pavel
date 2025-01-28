import mongoose from "mongoose";

const schema = new mongoose.Schema({
    id: Number,
    logs: {
        type: Number,
        default: 0
    },
    ref: Number,
    member: {
        type: Boolean,
        default: false
    },
    reg: Number,
    name: String,
    hiden: {
        type: Boolean,
        default: false
    },
    notify: {
        type: Boolean,
        default: false
    },
    lzt: String,
    admToken: String,
    lztOn: {
        type: Boolean,
        default: false
    },
    com: Number,
    blocked: {
        type: Boolean,
        default: false
    },
    notifyLztTechWork: {
        type: Boolean,
        default: false
    },
    report_day: {
        type: Boolean,
        default: true
    },
});

export default mongoose.model("user", schema);