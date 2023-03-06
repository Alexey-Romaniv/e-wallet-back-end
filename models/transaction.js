const {Schema, model} = require("mongoose");
const Joi = require("joi");

const {handleMongooseError} = require("../helpers");

const types = ["+", "-"];

const transactionSchema = new Schema(
    {
        date: {
            type: Date,
            required: true,
        },
        type: {
            type: String,
            enum: types,
            required: true,
        },
        category: {
            type: String,
        },
        comment: {type: String},
        sum: {
            type: Number,
            required: true,
        },
        wallet: {
            type: Number,
            required: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "user",
        },
    },
    {versionKey: false, timestamps: false}
);

transactionSchema.post("save", handleMongooseError);

const addSchema = Joi.object({
    date: Joi.date().required(),
    type: Joi.string()
        .valid(...types)
        .required(),
    category: Joi.string(),
    comment: Joi.string(),
    sum: Joi.number().required(),
});

const Transaction = model("transaction", transactionSchema);
module.exports = {
    Transaction,
    addSchema,
};
