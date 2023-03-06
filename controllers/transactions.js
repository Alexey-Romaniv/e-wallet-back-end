const { Transaction } = require("../models/transaction");
const { User } = require("../models/user");
const { ctrlWrapper, HttpError } = require("../helpers");

const getAll = async (req, res) => {
  const { _id: owner } = req.user;
  const result = await Transaction.find({ owner }).populate("owner", "email");
  res.json(result);
};

const add = async (req, res) => {
  const { _id: owner, wallet } = req.user;
  const { type, sum } = req.body;
  let newWallet = wallet;
  if (type === "+") {
    newWallet = Number(wallet) + Number(sum);
  }
  if (type === "-") {
    newWallet = Number(wallet) - Number(sum);
  }
  await User.findByIdAndUpdate(owner, { wallet: newWallet });
  const transaction = await Transaction.create({
    ...req.body,
    owner,
    wallet: newWallet,
  });
  res.status(201).json(transaction);
};

const removeById = async (req, res) => {
  const { transactionId } = req.params;
  const { _id: owner, wallet } = req.user;

  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    throw HttpError(404);
  }
  const { sum, type } = transaction;
  let newWallet = wallet;
  if (type !== "+") {
    newWallet = Number(wallet) + Number(sum);
  }
  if (type !== "-") {
    newWallet = Number(wallet) - Number(sum);
  }
  await User.findByIdAndUpdate(owner, { wallet: newWallet });

  await Transaction.findByIdAndDelete(transactionId, req.body);

  res.json({
    message: "Transaction delete",
    wallet: newWallet,
  });
};

module.exports = {
  getAll: ctrlWrapper(getAll),
  add: ctrlWrapper(add),
  removeById: ctrlWrapper(removeById),
};
