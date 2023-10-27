const express = require("express");
var coinbase = require('coinbase-commerce-node');
require("dotenv").config();
var Client = coinbase.Client;
 
const app = express();
var clientObj = Client.init(process.env.API_KEY);
clientObj.setRequestTimeout(3000);
var resources = coinbase.resources;
const Webhook = coinbase.Webhook;

app.use(express.json({
    verify: (req,  res, buf) => {
        const url = req.originalUrl;
        if(url.startsWith("/webhooks")) {
            req.rawBody = buf.toString();
        }
    }
}));
// ngrok config add-authtoken <token>
// ngrok http 80

app.post("/checkout", async(req, res) => {
    const { amount, currency } = req.body;
    try {
        const charge = await resources.Charge.create({
            name: "Test Charge",
            description: "Test charge description",
            local_price: {
                amount: amount,
                currency: currency,
            },
            pricing_type: "fixed_price",
            metadata: {
                user_id: "3434",
            }
        });
        console.log(charge)
        res.status(200).json(charge);
    }catch(err) {
        console.log(err);
    }
});

app.post("/webhooks", async(req, res) => {
    const event = Webhook.verifyEventBody(
        req.rawBody,
        req.headers['x-cc-webhook-signature'],
        process.env.WEBHOOK_SECRET
    );

    if(event.type === "charge:confirmed") {
        let amount = event.data.pricing.local.amount;
        let currency = event.data.pricing.local.currency;
        let user_id = event.data.metadata.user_id;

        console.log(amount, currency, user_id);
        res.status(200);
    }
})

app.listen(3000, ()=> {
    console.log("express server has started!")
})