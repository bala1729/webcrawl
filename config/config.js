const config = require("./config.json");

const environment = process.env.NODE_ENV || "development";
const environmentConfig = config[environment];

const getConfig = function() {
    return environmentConfig;
}

module.exports = Object.freeze({
    config: getConfig
});