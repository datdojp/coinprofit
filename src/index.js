/* eslint-disable no-console */
const _ = require('lodash');
const path = require('path');
const csv = require('csvtojson');

const filename = path.join(__dirname, '../csv/2022_trading_report.csv');
const method = '総平均法'; // or ''
const yearBeginAmount = 0;
const yearBeginPrice = 0;

async function main() {
  const amountPrecision = 8;
  const transactionTypeRegExp = /^取引所現物取引|販売所取引$/;

  const json = await csv().fromFile(filename);

  if (method === '移動平均法') {
    let curAmount = yearBeginAmount;
    let curPrice = yearBeginPrice;
    let profit = 0;
    _.chain(json)
      .filter((trans) => transactionTypeRegExp.test(trans['精算区分']))
      .orderBy(['日時'], ['asc'])
      .each((trans) => {
        const amount = parseFloat(trans['約定数量']);
        const price = parseInt(trans['約定レート'], 10);
        const balance = parseInt(trans['約定金額'], 10);
        const isBuy = trans['売買区分'] === '買';
        if (isBuy) {
          curPrice = (curAmount * curPrice + balance) / (curAmount + amount);
          curAmount += amount;
        } else {
          profit += amount * (price - curPrice);
          curAmount -= amount;
        }
      })
      .value();
    console.log(JSON.stringify({
      annualProfit: _.round(profit),
      remainAmount: _.round(curAmount, amountPrecision),
      remainAmountPrice: _.round(curPrice),
    }, null, 2));
  }

  if (method === '総平均法') {
    const getTransactionAmount = (trans) => parseFloat(trans['約定数量']);
    const getTransationBalance = (trans) => parseInt(trans['約定金額'], 10);

    const buyTransactions = _.chain(json)
      .filter((trans) => transactionTypeRegExp.test(trans['精算区分']) && trans['売買区分'] === '買')
      .concat({
        約定数量: yearBeginAmount,
        約定レート: yearBeginPrice,
        約定金額: yearBeginAmount * yearBeginPrice,
      });
    const buyTotalAmount = _.round(
      buyTransactions.sumBy(getTransactionAmount).value(),
      amountPrecision,
    );
    const buyTotalBalance = buyTransactions
      .sumBy(getTransationBalance)
      .value();
    const buyAveragePrice = _.round(buyTotalBalance / buyTotalAmount);

    const sellTransactions = _.chain(json)
      .filter((trans) => transactionTypeRegExp.test(trans['精算区分']) && trans['売買区分'] === '売');
    const sellTotalAmount = _.round(
      sellTransactions.sumBy(getTransactionAmount).value(),
      amountPrecision,
    );
    const sellTotalBalance = sellTransactions.sumBy(getTransationBalance).value();
    const sellAvgPrice = _.round(sellTotalBalance / sellTotalAmount);

    const annualProfit = _.round(sellTotalAmount * (sellAvgPrice - buyAveragePrice));
    const remainAmount = _.round(buyTotalAmount - sellTotalAmount, amountPrecision);

    console.log(JSON.stringify({
      buyTotalAmount,
      buyTotalBalance,
      buyAveragePrice,
      sellTotalAmount,
      sellTotalBalance,
      sellAvgPrice,
      annualProfit,
      remainAmount,
      remainAmountPrice: buyAveragePrice,
    }, null, 2));
  }
}

main();
