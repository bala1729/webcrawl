const { ProxyCrawlAPI } = require("proxycrawl");
const makeDir = require("make-dir");
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const json2csv = require('json2csv').parse;
const R = require("ramda");
const crawlProduct = require("./crawlproduct.js");
const config = require("./config/config.json");

const environment = process.env.NODE_ENV || "development";
const environmentConfig = config[environment];

const crawler = new ProxyCrawlAPI({ token: environmentConfig.proxyCrawlApiToken });

const domain = environmentConfig.amazonDomain;


const searchKeyword = process.argv[2];

let pageRefUrl = "/s/ref=nb_sb_noss_1?url=search-alias%3Daps&field-keywords=" + searchKeyword;

const baseFileName = "crawl_output.csv";
const basePath=process.argv[3];

const numberOfPages = environmentConfig.numberOfPagesToCrawl;
let currentPageNumber = 0;

let products = [];
let pagePromises = [];
while (currentPageNumber < numberOfPages) {
    currentPageNumber = currentPageNumber + 1;
    let url = domain+pageRefUrl+"&page="+currentPageNumber;
    console.log("page url : ", url);
    pagePromises.push(Promise.resolve(crawler.get(url, {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/600.7.12 (KHTML, like Gecko) Version/8.0.7 Safari/600.7.12',
      format: 'html',
      country: 'CA'
  })));
}

Promise.all(pagePromises).then(responses => {
  responses.forEach(function(response){
      if (response.statusCode === 200) {
        const $ = cheerio.load(response.body);
        let pageNumber = $(".pagnCur").text();
        $(".s-result-item").each(function(i,element) {
          let product = {};
          let item = $(this);

          product.asin = item.attr("data-asin");
          product.title = item.find("span.a-size-medium.a-color-base.a-text-normal").eq(0).text().trim();

          const currency = item.find("span.a-price-symbol").eq(0).text().trim();
          const priceWhole = item.find("span.a-price-whole").eq(0).text().trim();
          const priceFraction = item.find("span.a-price-fraction").eq(0).text().trim();
          const totalPrice = priceWhole + priceFraction;

          product.price = totalPrice;
          product.currency = currency;

          product.stockInfo = item.find("span.a-color-price").eq(0).text().trim();
          products.push(product);

        });

    } else {
        console.error("Crawler error ", response.pcStatus + ": " + response.body);
    }
  });
//console.log("products ", products);
  // Filtering result - rules
  // 1. asin undefined
  // 2. eligibleForShipping false
  let filteredProducts = R.filter(product => !R.isNil(product.asin)
  && !R.isNil(product.price)
  && (product.currency === "$")
  ,products);


  console.log("total products found : ", products.length);
  console.log("filtered products : ", filteredProducts.length);

  // Now loop thru the filtered products and access each product page
  // to scrape more product information

  fetchProductPageInfoForAllProducts(crawler, domain, filteredProducts).then(function(finalProducts) {
      console.log("Shippable products ", finalProducts.length)
      if (!R.isEmpty(finalProducts)) {
          writeToFile(finalProducts, Object.keys(R.head(finalProducts)));
      } else {
          console.error("No products found after applying filter rules");
      }
  })



})
.catch(function(error){
    console.error("Error occured in crawler. Error: ", error);
});

async function fetchProductPageInfoForAllProducts(crawler, domain, products) {
    let augmentedProducts = [];

    for (let i=0; i<products.length; i++) {
        const productInfo = await crawlProduct.getProductInfo(crawler, domain, products[i].asin);
        products[i].primeEligible = productInfo.primeEligible;
        if (productInfo.primeEligible === 'Fulfilled by Amazon') {
            augmentedProducts.push(products[i]);
        }
    }

    return Promise.resolve(augmentedProducts);

}

function writeToFile(products, fields) {

    try {
      const csv = json2csv(products, {fields});
      //write to file
      const dir = path.join(basePath, searchKeyword.substring(0,10));
      makeDir(dir).then(x => {
        const filePath = path.join(dir, baseFileName);
        let writeStream = fs.createWriteStream(filePath);
        writeStream.write(csv, 'ascii');
        writeStream.on('finish', () => {
            console.log('wrote all data to file');
        });
        writeStream.end();
      }).catch(error => console.log(error));
    } catch (err) {
      console.error("csv parsing error ", err);
    }
}
