import mongoose from "mongoose";

const schema = new mongoose.Schema({
    id: Number,
    worker: Number,
    name: String,
    template: Number
});

export default mongoose.model("domain", schema);