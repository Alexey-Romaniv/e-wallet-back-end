const {Schema, model} = require("mongoose");
const Joi = require("joi");

const {handleMongooseError} = require("../helpers");

const userSchema = new Schema(
    {
        password: {
            type: String,
            required: [true, "Set password for user"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        avatarURL: String,
        token: String,
        verify: {
            type: Boolean,
            default: false,
        },
        verificationToken: {
            type: String,
            required: [true, "Verify token is required"],
        },
        wallet: {
            type: Number,
            default: 0,
        },
    },

    {versionKey: false, timestamps: true}
);

userSchema.post("save", handleMongooseError);

const registerSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});
const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
})

const verifyEmailSchema = Joi.object({
    email: Joi.string().email().required(),
});

const schemas = {
    registerSchema,
    loginSchema,
    verifyEmailSchema,
};

const User = model("user", userSchema);

module.exports = {
    User,
    schemas,
};
