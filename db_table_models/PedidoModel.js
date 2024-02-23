const Sequelize = require("sequelize");
const connection = require("../database/sql_server_connection");

const PedidoModel = connection.define("WMSPED", {
    CODFIL: {
        type: Sequelize.INTEGER
    },
    CODIGO: {
        type: Sequelize.INTEGER
    },
    CODCTS: {
        type: Sequelize.INTEGER
    },
    CODCLIFOR: {
        type: Sequelize.INTEGER
    },
    CODCTC: {
        type: Sequelize.INTEGER
    },
    DATPED: {
        type: Sequelize.STRING
    },
    DATARM: {
        type: Sequelize.STRING
    },
    OBSERV: {
        type: Sequelize.STRING
    },
    DATINC: {
        type: Sequelize.STRING
    },
    DATATU: {
        type: Sequelize.STRING
    },
    USUATU: {
        type: Sequelize.STRING
    },
    TIPPED: {
        type: Sequelize.STRING
    },
    SITUAC: {
        type: Sequelize.STRING
    },
    STATUS: {
        type: Sequelize.STRING
    },
    CLIPED: {
        type: Sequelize.STRING
    },
    CLIROT: {
        type: Sequelize.STRING
    },
    CLIROM: {
        type: Sequelize.STRING
    },
    DATENT: {
        type: Sequelize.STRING
    },
    PERMAN: {
        type: Sequelize.DECIMAL
    },
    ORIGEM: {
        type: Sequelize.STRING
    },
    NUMBLO: {
        type: Sequelize.INTEGER
    },
    OBSFIS: {
        type: Sequelize.STRING
    },
    TIPPES: {
        type: Sequelize.STRING
    },
    PESAVU: {
        type: Sequelize.STRING
    },
    TIPSAI: {
        type: Sequelize.STRING
    },
    CODTRA: {
        type: Sequelize.INTEGER
    },
    CODOCA: {
        type: Sequelize.STRING
    },
    DATBAI: {
        type: Sequelize.STRING
    },
    USUBAI: {
        type: Sequelize.STRING
    },
    RESPFR: {
        type: Sequelize.STRING
    }
},
{
    charset: 'utf8',
    collate: 'utf8_unicode_ci'
});

module.exports = PedidoModel;