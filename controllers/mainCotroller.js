const express = require('express')
const app = express()

app.set("view engine", "ejs");

function home_page(req, res) {
    res.render('index')
}

module.exports = {
    home_page
}

