const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const Jimp = require("jimp");
const fs = require("fs/promises");
const path = require("path");
const {nanoid} = require("nanoid");

const {User} = require("../models/user");
const {ctrlWrapper, HttpError, sendEmail} = require("../helpers/index");

require("dotenv").config();
const secret = process.env.SECRET_KEY;
const baseUrl = process.env.BASE_URL;

const register = async (req, res) => {
    const {email, password, name} = req.body;
    const user = await User.findOne({email});

    if (user) {
        throw HttpError(409, "Email in use");
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const avatarURL = gravatar.url(email);
    const verificationToken = nanoid();

    const newUser = await User.create({
        ...req.body,
        password: hashPassword,
        avatarURL,
        verificationToken,
    });
    const verifyEmail = {
        to: email,
        subject: "Verify your email",
        html: `<a target="_blank" href="${baseUrl}/api/users/verify/${verificationToken}">Click to verify email</a>`,
    };
    await sendEmail(verifyEmail);

    const id = newUser._id;
    const token = jwt.sign({id}, secret, {expiresIn: "23h"});
    await User.findByIdAndUpdate(id, {token});

    res.status(201).json({
        token,
        user: {
            name,
            email,
            avatarURL,
            wallet: user.wallet
        },
    });
};

const login = async (req, res) => {
    const {email, password} = req.body;

    const user = await User.findOne({email});
    if (!user) {
        throw HttpError(401, "Email or password wrong!");
    }
    const compareResult = await bcrypt.compare(password, user.password);

    if (!compareResult) {
        throw HttpError(401, "Email or password wrong!");
    }

    const id = user._id;
    const token = jwt.sign({id}, secret, {expiresIn: "23h"});
    await User.findByIdAndUpdate(id, {token});

    res.status(201).json({
        token,
        user: {
            name: user.name,
            email,
            avatarURL: user.avatarURL,
            wallet: user.wallet,
        },
    });
};

const logout = async (req, res) => {
    const {_id} = req.user;
    await User.findByIdAndUpdate(_id, {token: ""});
    res.status(204).end();
};

const getCurrent = async (req, res) => {
    const {name,email, wallet, avatarURL, token} = req.user;
    res.json({
        token,
        user: {
            name,
            email,
            wallet,
            avatarURL,
        }
    });
};

const updateAvatar = async (req, res) => {
    const {_id} = req.user;

    const avatarDir = path.join(__dirname, "../public/avatars");

    const {path: teamUpload, originalname} = req.file;
    const filename = `${_id}_${originalname}`;

    const resultUpload = path.join(avatarDir, originalname);

    await Jimp.read(teamUpload)
        .then((lenna) => lenna.resize(250, 250).write(resultUpload))
        .catch((e) => console.log(e));

    await fs.unlink(teamUpload);

    const avatarURL = path.join("avatars", filename);
    await User.findByIdAndUpdate(_id, {avatarURL});
    res.json({
        avatarURL,
    });
};

const verify = async (req, res) => {
    const {verificationToken} = req.params;
    const user = await User.findOne({verificationToken});
    if (!user) {
        throw HttpError(404, "User not found");
    }

    await User.findByIdAndUpdate(user._id, {
        verify: true,
        verificationToken: "",
    });

    res.json({
        message: "Verification successful",
    });
};

const resendVerifyEmail = async (req, res) => {
    const {email} = req.body;
    const user = await User.findOne({email});
    if (!user) {
        throw HttpError(404, "User not found");
    }

    if (user.verify) {
        throw HttpError(400, "Verification has already been passed");
    }

    const verifyEmail = {
        to: email,
        subject: "Verify your email",
        html: `<a target="_blank" href="${baseUrl}/api/users/verify/${user.verificationToken}">Click to verify email</a>`,
    };
    await sendEmail(verifyEmail);

    res.json({
        message: "Verification email sent",
    });
};

module.exports = {
    register: ctrlWrapper(register),
    login: ctrlWrapper(login),
    getCurrent: ctrlWrapper(getCurrent),
    logout: ctrlWrapper(logout),
    updateAvatar: ctrlWrapper(updateAvatar),
    verify: ctrlWrapper(verify),
    resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
};
