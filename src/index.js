/* eslint-disable no-console */
const _ = require('lodash');
const path = require('path');
const csv = require('csvtojson');

const filename = path.join(__dirname, '../csv/2022_trading_report.csv');

async function main() {
  const json = await csv().fromFile(filename);

  let curAmount = 0.02818783;
  let curPrice = 5644050;
  let profit = 0;
  _.chain(json)
    .filter({ 精算区分: '取引所現物取引' })
    .orderBy(['日時'], ['asc'])
    .each((trans) => {
      const amount = parseFloat(trans['約定数量']);
      const price = parseInt(trans['約定レート'], 10);
      const isBuy = trans['売買区分'] === '買';
      if (isBuy) {
        curPrice = (curAmount * curPrice + amount * price) / (curAmount + amount);
        curAmount += amount;
        console.log(`"${amount}" at "${price}", curAmount="${curAmount}", curPrice="${_.round(curPrice)}"`);
      } else {
        profit += amount * (price - curPrice);
        curAmount -= amount;
        console.log(`=== "${amount}" at "${price}", profit="${_.round(profit)}", curAmount="${curAmount}", curPrice="${_.round(curPrice)}"`);
      }
    })
    .value();
}

main();
