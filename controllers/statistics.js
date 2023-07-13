const {getAll} = require('./transactions')

const groupBy = (objectArray, property) => {
    return objectArray.reduce((acc, obj) => {
        const key = obj[property];
        const curGroup = acc[key] ?? [];

        return { ...acc, [key]: [...curGroup, obj] };
    }, {});
}
const getAllStatistics = () => {

    const categories = getAll().map((el) => el.category);
    console.log(categories);
    const total = categories.reduce((acc, { sum}) => acc + sum, 0)
return total;
}
const groupByCategories = groupBy(getAll(), "category");

module.exports = {
    getAllStatistics,
    groupByCategories,
}