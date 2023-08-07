const {Transaction} = require("../models/transaction");
const {User} = require("../models/user");
const {ctrlWrapper, HttpError} = require("../helpers");

const getAll = async (req, res) => {
    const {_id: owner} = req.user;
    const result = await Transaction.find({owner}).populate("owner", "email");
    res.json(result);
};

const getFilteredTransactions = async (req, res) => {
    const {_id: owner} = req.user;
    const {month, year} = req.query;

    try {

        let transactions;
        if (month && year) {
            // Преобразование месяца и года в числовой формат
            const numericMonth = parseInt(month, 10);
            const numericYear = parseInt(year, 10);

            const startDate = new Date(numericYear, numericMonth - 1, 1);
            const endDate = new Date(numericYear, numericMonth, 1);

            // Получаем отфильтрованные транзакции по месяцу и году
            transactions = await Transaction.find({
                owner,
                date: {$gte: startDate, $lt: endDate},
            });
        } else {
            // Если не указан месяц и год, получаем все транзакции пользователя
            transactions = await Transaction.find({owner});
        }

        // Создаем объект для хранения суммы траты по категориям
        const categories = {};
        const result = {categories, expenses: 0, income: 0};
        // Вычисляем сумму траты для каждой категории
        transactions.forEach((transaction) => {
            const category = transaction.category;
            const sum = transaction.sum;

            if (category) {
                categories[category] = (categories[category] || 0) + sum;
                result.expenses += sum;
            } else {
              result.income += sum;
            }

        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Внутренняя ошибка сервера"});
    }
};

const add = async (req, res) => {
    const {_id: owner, wallet} = req.user;
    const {type, sum} = req.body;
    let newWallet = wallet;
    if (type === "+") {
        newWallet = Number(wallet) + Number(sum);
    }
    if (type === "-") {
        newWallet = Number(wallet) - Number(sum);
    }
    const transaction = await Transaction.create({
        ...req.body,
        owner,
        wallet: newWallet,
    });

    // Обновляем баланс пользователя
    await User.findByIdAndUpdate(owner, {wallet: newWallet});

    // Получаем текущий список транзакций пользователя
    const userTransactions = await Transaction.find({ owner }).sort({ createdAt: -1 });

    // Добавляем новую транзакцию в начало списка
    userTransactions.unshift(transaction);

    res.status(201).json(transaction);
};

const removeById = async (req, res) => {
    const {transactionId} = req.params;
    const {_id: owner, wallet} = req.user;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
        throw HttpError(404);
    }
    const {sum, type} = transaction;
    let newWallet = wallet;
    if (type !== "+") {
        newWallet = Number(wallet) + Number(sum);
    }
    if (type !== "-") {
        newWallet = Number(wallet) - Number(sum);
    }
    await User.findByIdAndUpdate(owner, {wallet: newWallet});

    await Transaction.findByIdAndDelete(transactionId, req.body);

    res.json({
        message: "Transaction delete",
        wallet: newWallet,
    });
};

module.exports = {
    getAll: ctrlWrapper(getAll),
    getFilteredTransactions: ctrlWrapper(getFilteredTransactions),
    add: ctrlWrapper(add),
    removeById: ctrlWrapper(removeById),
};
