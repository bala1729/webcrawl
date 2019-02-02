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
      //country: 'CA'
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
          let itemDetails = item.children(".s-item-container").children(".a-fixed-left-grid").children(".a-fixed-left-grid-inner")
          .children(".a-fixed-left-grid .a-col-right");
          let itemTop = $(itemDetails).children().eq(0);
          let itemCentre = $(itemDetails).children().eq(1);
          let itemDetailsBottom = $(itemDetails).children().eq(2);
          //product.title = $(itemDetails).children(".a-row .a-spacing-small").eq(0).children().eq(0).children().eq(0).text();
          product.title = $(itemTop).eq(0).children().eq(0).children().eq(0).text();
          let eligibleForShipping = $(itemCentre).children().eq(0).text();
          if (!R.isNil(eligibleForShipping) && eligibleForShipping.startsWith("Eligible for Shipping to")) {
            product.eligibleForShipping = true;
          } else {
            product.eligibleForShipping = false;
          }
          let itemDetailsLeft = $(itemDetailsBottom).children().eq(0);
          let itemDetailsRight = $(itemDetailsBottom).children().eq(1);
          product.price = $(itemDetailsLeft).eq(0).children().eq(0).children().eq(0).children().eq(0).text();

          products.push(product);

        });

    } else {
        console.error("Crawler error ", response.pcStatus);
    }
  });

  console.log("products ", products);
  // Filtering result - rules
  // 1. asin undefined
  // 2. eligibleForShipping false
  let filteredProducts = R.filter(product => !R.isNil(product.asin)
  && !R.isNil(product.price)
  && product.price.startsWith("$")
  && product.eligibleForShipping
  ,products);

  console.log("total products found : ", products.length);
  console.log("filtered products : ", filteredProducts.length);

  // Now loop thru the filtered products and access each product page
  // to scrape more product information

  // filteredProducts.forEach(product => {
  //     const productInfo = crawlProduct.getProductInfo(crawler, domain, product.asin);
  //     // crawlProduct.getProductInfo(crawler, domain, product.asin).then(function(response){
  //     //     console.log(response);
  //     // });
  //
  // });

  if (!R.isEmpty(filteredProducts)) {
      writeToFile(filteredProducts, Object.keys(R.head(filteredProducts)));
  } else {
      console.log("No products found after applying filter rules");
  }



});

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
