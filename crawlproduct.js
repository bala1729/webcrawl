const cheerio = require("cheerio");
const { ProxyCrawlAPI } = require("proxycrawl");
const R = require("ramda");

const getProductInfo = async function (crawler, domain, productAsin) {

    const productInfo = {};
    try {
        const productUrl = domain + "/dp/" + productAsin;
        const response = await crawler.get(productUrl, {
              userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/600.7.12 (KHTML, like Gecko) Version/8.0.7 Safari/600.7.12',
              format: 'html',
              country: 'CA'
        });
        if (response.statusCode === 200) {
            const $ = cheerio.load(response.body);
            productInfo.price = $("span#price_inside_buybox").text().trim();
            const merchantInfo = $("div#merchant-info");
            const amazonFulfillment = merchantInfo.find("a#SSOFpopoverLink").text().trim();
            productInfo.primeEligible = amazonFulfillment;

        } else {
          console.error("Product page crawl error for "+productAsin);
        }
    } catch(err) {
        console.error("Error occured crawling Product page. Error: ", err);
    }
    await sleep(3000); // sleep for 3s to make this be like a realistic human browsing
    return Promise.resolve(productInfo);

}

function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

module.exports = {
    getProductInfo: getProductInfo
}
