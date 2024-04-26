const express = require("express");
require('dotenv').config();
const app = express();
const connection = require("./database/sql_server_connection");
const http = require("http").createServer(app);
const Arquivo = require("./models/Arquivo");

// Database
connection
    .authenticate()
    .then(() => {
        console.log("Conexão com o banco de dados estabelecida!");
    })
    .catch((msgError) => {
        console.log(msgError);
    });

function startTimer(duration) {
    var timer = duration, minutes, seconds;

    setInterval(async () => {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        var display = minutes + ":" + seconds;
        console.log(display);

        // socket.emit("displayTimer", { display, timer });

        if (--timer < 0) {
            main();
            timer = duration;
        }
    }, 1000);
}

http.listen(8181, () => {
    console.log("App rodando!");
    var fiveMinutes = 60 * 5;
    startTimer(fiveMinutes);
});

async function main() {
    const arquivo = new Arquivo();
    let date = new Date();
    let hours = date.getHours();

    await arquivo.CreateFiles();
    await arquivo.SendEmail();


    if(hours == 3) {
        await arquivo.DeleteOldSavedFiles();
    }
}

main();