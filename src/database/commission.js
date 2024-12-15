import mongoose from "mongoose";

const schema = new mongoose.Schema({
    value: {
        type: Number,
        default: 0
    },
    
});

export default mongoose.model("commission", schema);