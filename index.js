// Hämta stöd för Express
var express = require('express');
var app = express();

// Definiera serverns port
const port = 27017;

// Stöd för body-parsing
const bodyParser = require('body-parser');
app.use(
  bodyParser.urlencoded({
    extended: true
  })
)
app.use(bodyParser.json());

// Stöd för CORS
const cors = require('cors');

// Tillåt anrop från alla domäner
app.use(cors({
  origin: "*"
}));

// Stöd för Mongoose
var mongoose = require('mongoose');

// Anslut Mongoose till databasen
mongoose.connect('mongodb+srv://andsimdev:hNUnHrtfvVxo6bQR@skolan.h0xqr.mongodb.net/Skolan?retryWrites=true&w=majority');
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection-error:'));

// Kör kod när databasanslutningen är öppen
db.once('open', function (callback) {
  console.log("Ansluten till databasen");

  // Skapa databasschema
  var purchaseSchema = mongoose.Schema({
    purchaseTitle: String,
    purchaseDate: Date,
    purchaseCost: Number,
    purchaseInfo: String
  });

  var Purchase = mongoose.model('Purchase', purchaseSchema);

  // Hämta alla poster från databasen
  Purchase.find(function (err, purchases) {
    if (err) return console.error(err);
    allPurchases = purchases;
  });

  /* GET - hämta alla poster */
  app.get('/', function (req, res, next) {
    // Skapa JSON-objekt med hämtade poster från databasen
    let jsonObj = JSON.stringify(allPurchases);

    // Tillåt cors
    res.set('Access-Control-Allow-Origin', '*');

    // Ange att svaret är i JSON-format
    res.contentType('application/json');

    // Skicka svaret
    res.send(jsonObj);
  });

  /* GET/id - hämta enskild post */
  app.get('/:id', function (req, res, next) {
    // Lagra medskickat id
    let id = req.params.id;

    // Variabel för index
    let ind = -1;

    // Leta efter önskat id
    for (let i = 0; i < allPurchases.length; i++) {
      if (allPurchases[i]._id == id) ind = i;
    }

    // Tillåt cors
    res.set('Access-Control-Allow-Origin', '*');

    // Ange att svaret är i JSON-format
    res.contentType('application/json');

    // Skicka svar. Om post saknas för medskickat id returneras {}
    res.send(ind >= 0 ? allPurchases[ind] : '{}');
  });

  /* POST - skapa ny post */
  app.post('/', function (req, res, next) {
    // Skapa ny post från medskickad data
    var purchase = new Purchase({
      purchaseTitle: req.body.purchaseTitle,
      purchaseDate: req.body.purchaseDate,
      purchaseCost: req.body.purchaseCost,
      purchaseInfo: req.body.purchaseInfo
    });

    // Lagra posten i databasen
    purchase.save(function (err) {
      if (err) {
        return console.error(err);
      } else {
        // Hämta uppdaterade poster från databasen för att skicka som svar
        Purchase.find(function (err, purchases) {
          if (err) return console.error(err);

          // Lagra hämtade poster
          allPurchases = purchases;

          // Skapa JSON-objekt med hämtade poster från databasen
          let jsonObj = JSON.stringify(allPurchases);

          // Ange att svaret är i JSON-format
          res.contentType('application/json');

          // Skicka svaret
          res.send(jsonObj);
        });
      }
    })
  });

  /* PUT */
  app.put('/:id', function (req, res, next) {
    // Hämta medskickat id
    let id = req.params.id;

    // Uppdatera enskild post ur databasen
    Purchase.findById(id, function (err, doc) {
      if (err) {
        console.error(err);
      } else {
        doc.purchaseTitle = req.body.purchaseTitle;
        doc.purchaseDate = req.body.purchaseDate;
        doc.purchaseCost = req.body.purchaseCost;
        doc.purchaseInfo = req.body.purchaseInfo;

        // Lagra posten i databasen
        doc.save(function (err) {
          if (err) {
            return console.error(err);
          } else {
            // Hämta och skicka tillbaka uppdaterade poster
            Purchase.find(function (err, purchases) {
              if (err) return console.error(err);
              allPurchases = purchases;
              let jsonObj = JSON.stringify(allPurchases);
              res.contentType('application/json');
              res.send(jsonObj);
              console.log("Posten med id " + id + " uppdaterades.");
            });
          }
        })
      }
    })
  });

  /* DELETE - radera en post */
  app.delete('/:id', function (req, res, next) {
    // Hämta medskickat id
    let id = req.params.id;

    // Radera enskild post ur databasen
    Purchase.deleteOne({ "_id": id }, function (err) {
      if (err) {
        console.error(err);
      } else {
        console.log("Posten med id " + id + " raderades.");

        // Hämta och skicka tillbaka uppdaterade poster
        Purchase.find(function (err, purchases) {
          if (err) return console.error(err);
          allPurchases = purchases;
          let jsonObj = JSON.stringify(allPurchases);
          res.contentType('application/json');
          res.send(jsonObj);
        });
      }
    })
  })
});

// Starta server mot önskad port
app.listen(port, () => {
  console.log("Server startad på port " + port);
});