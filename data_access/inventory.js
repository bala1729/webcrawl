const connectionPool = require("./postgres");


const upsertProduct = async function(product) {
    try {
        const dbProduct = await getProductByAsin(product.external_product_id);
        if (dbProduct) {
            updateProduct(product);
        } else {
            insertProduct(product);
        }
    } catch(err) {
        console.error("Error occured: ", err);
    } finally {

    }
}

const getProductByAsin = async function(asin) {
    const pool = await connectionPool.getPool();

    const client = await pool.connect();
    try {
        const result = await client.query("Select * from inventory.amazon_inventory where external_product_id = '" + asin + "' and external_product_id_type = 'ASIN'");
        return result.rows[0];
    } catch(err) {
        console.error("Error occured: ", err);
        //client.end();
        throw err;
    } finally {
        client.release();
    }
    return null;
}

const updateProduct = async function(product) {
    const pool = await connectionPool.getPool();

    const client = await pool.connect();
    try {
        const updateQuery =`update inventory.amazon_inventory set quantity = $1, standard_price = $2,
            stock_info = $3, update_date = now() where external_product_id = $4`;

        const valueSet = [];
        valueSet.push(product.quantity);
        valueSet.push(product.standard_price);
        valueSet.push(product.stock_info);
        valueSet.push(product.external_product_id);

        const result = await client.query(updateQuery, valueSet);
        return result.rowCount;
    } catch(err) {
        console.error("Error occured: ", err);
        throw err;
    } finally {
        client.release();
    }

    return null;
}

const insertProduct = async function(product) {
    const pool = await connectionPool.getPool();

    const client = await pool.connect();
    try {
        const insertQuery = `insert into inventory.amazon_inventory(external_product_id, external_product_id_type, lead_time_to_ship, 
            standard_price, condition_type, create_date, stock_info, currency, title, quantity) 
            values(`;
        const valueSet = [];
        valueSet.push("'"+product.external_product_id+"'");
        valueSet.push("'ASIN'");
        valueSet.push(10);
        valueSet.push(product.standard_price);
        valueSet.push("'NEW'");
        valueSet.push("now()");
        valueSet.push("'"+product.stock_info+"'");
        valueSet.push("'"+product.currency+"'");
        valueSet.push("'"+product.title+"'");
        valueSet.push(product.quantity);

        const result = await client.query(insertQuery+valueSet.join(",")+")");
        return result.rows[0];
    } catch(err) {
        console.error("Error occured: ", err);
        throw err;
    } finally {
        client.release();
    }

    return null;
    
}

// const product = {
//     external_product_id: 'B071LP69PR8',
//     external_product_id_type: 'ASIN',
//     title: "Doesnt exist",
//     stock_info: "Only 50 left",
//     quantity: 130,
//     currency: "USD",
//     standard_price: 56.89
// };

// (async function() {
//     await upsertProduct(product);
// })();

module.exports = Object.freeze({
    upsertProduct: upsertProduct
})