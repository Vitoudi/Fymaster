const express = require("express");
const app = express();
const mainController = require('../controllers/mainCotroller')

const router = express.Router()

//register view engine
app.set("views", path.join(__dirname, "/frontend/views"));
app.set('view engine', 'ejs')

app.get('/', mainController.home_page)

//start listen
app.listen(3000)