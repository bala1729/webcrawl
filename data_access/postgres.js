const {Pool} = require("pg");
const config = require("../config/config").config();

const pool = new Pool({
  connectionString: config.dbConnectString,
})

const getPool = function() {
    return pool;
}

module.exports = Object.freeze({
    getPool: getPool
});

