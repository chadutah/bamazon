// Dependencies
var mysql = require('mysql');
var wrap = require('word-wrap');
var Table = require('cli-table');
var inquirer = require('inquirer');
var colors = require('colors');

// sets connection param for database connection
var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
  
    // Your username
    user: "root",
  
    // Your password
    password: "",
    database: "bamazon"
  });
  
  // connect to the mysql server and sql database
  connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    itemsForSale();
});

// A query which returns all items available for sale ().
function itemsForSale() {
    connection.query("SELECT id, product, price, department FROM product WHERE price > 0;", function (err, result) {
        // gets and builds the table header
        var obj = result[0];
        var header = [];
        for (var prop in obj) {
            header.push(prop);
        }

        // instantiate 
        var table = new Table({
            head: header,
            colWidths: [20, 55, 10, 20]
        });

        // gets and sets the data in the table
        var item_ids = [];
        for (var i = 0; i < result.length; i++) {
            item_ids.push(result[i].id);
            table.push([result[i].id, wrap(result[i].product), result[i].price.toFixed(2), result[i].department]);
        }
        var output = table.toString();
        console.log(output);
        purchaseItem(item_ids);
    });
}

// sets function for cutomer to make a purchase
// list gets the items id's as an array and passed to the promt/choices param
function purchaseItem(list) {
    inquirer
        .prompt([{
            name: "buy",
            type: "list",
            message: "Please indicate which item would you like to purchase?",
            choices: list
        },
        {
            name: "quantity",
            type: "input",
            message: "Please enter quantity?",
        }])
        .then(function (answer) {
            // sets a query to select the item the user has chosen
            var query = "SELECT id, stock, price FROM product WHERE ?";
            connection.query(query, { id: answer.buy }, function (err, res) {
                // console.log(res);
                var inputQuantity = answer.quantity;
                checkStock(res[0].stock, inputQuantity, res[0].price.toFixed(2), res[0].id);
            });
        })
}

// checks quantity against the stock
function checkStock(on_stock, buy_quantity, price, id) {
    if (on_stock >= buy_quantity) {
        var total_price = buy_quantity * price;
        console.log(`Your total amount is $${total_price}.\nThank you for your purchase on BAMAZON!`.green);
        // updates database
        updateStock(buy_quantity, id);
    } else {
        console.log(`Insufficient quantity on stock!\nOnly ${on_stock} items on stock!`.red);
        connection.end();
    }
}

// updates stock_quantity in the database
function updateStock(quantity, id) {
    var query = "UPDATE product SET stock = stock - ? WHERE ?";
    connection.query(
        query,
        [
            quantity,
            {
                id: id
            }
        ],
        function (error) {
            if (error) throw error;
            console.log("DB was succefully updated!");
            connection.end();
        });
}
