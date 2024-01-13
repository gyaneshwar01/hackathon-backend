import * as fs from "fs";
import * as csv from "fast-csv";

interface StockData {
  Date: string;
  Open: string;
  High: string;
  Low: string;
  Close: string;
  Volume: string;
  Symbol: string;
  Percentage: string;
}

export const readStockDataFromCSV = (
  filePath: string
): Promise<StockData[]> => {
  return new Promise((resolve, reject) => {
    const stockData: StockData[] = [];

    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true, delimiter: "," })) // Assuming comma-delimited file
      .on("data", (row) => {
        stockData.push(row);
      })
      .on("end", () => {
        resolve(stockData);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};
