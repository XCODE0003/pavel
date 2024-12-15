import mongoose from "mongoose";

const schema = new mongoose.Schema({
    id: Number,
    owner: Number,
    type: String,
    name: String,
    desc: String,
    image: String,
    bio: String,
});

export default mongoose.model("domainTemplate", schema);