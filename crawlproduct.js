const cheerio = require("cheerio");
const { ProxyCrawlAPI } = require("proxycrawl");
const R = require("ramda");

const getProductInfo = async function (crawler, domain, productAsin) {

    const productInfo = {};
    const productUrl = domain + "/dp/" + productAsin;
    const response = await crawler.get(productUrl, {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/600.7.12 (KHTML, like Gecko) Version/8.0.7 Safari/600.7.12',
          format: 'html',
          //country: 'CA'
    });
    if (response.statusCode === 200) {
        const $ = cheerio.load(response.body);
        productInfo.price = $("span#price_inside_buybox").text().trim();

    } else {
      console.error("Product page crawl error for "+productAsin);
    }
        //return Promise.resolve(productInfo);

    return productInfo;

}

module.exports = {
    getProductInfo: getProductInfo
}
