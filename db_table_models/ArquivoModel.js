const Sequelize = require("sequelize");
const connection = require("../database/sql_server_connection");

const ArquivoModel = connection.define("VW_ENVIA_M51_EMAIL", {
    CODPED: {
        type: Sequelize.INTEGER
    },
    CODFIL: {
        type: Sequelize.INTEGER,
    },
    CODPRO: {
        type: Sequelize.INTEGER
    },
    REFCLI: {
        type: Sequelize.STRING,
    },
    NUMITE: {
        type: Sequelize.STRING
    },
    QUANTI: {
        type: Sequelize.INTEGER,
    },
    CODLOT: {
        type: Sequelize.STRING
    },
    SITUAC: {
        type: Sequelize.STRING,
    },
    REFPRF: {
        type: Sequelize.STRING
    },
    CODUNI: {
        type: Sequelize.STRING,
    },
    DATINC: {
        type: Sequelize.STRING,
    },
    ARQTXT: {
        type: Sequelize.STRING,
    }
},
{
    charset: 'utf8',
    collate: 'utf8_unicode_ci'
});

module.exports = ArquivoModel;