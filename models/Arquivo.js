const { QueryTypes } = require("sequelize");
const sqlConnection = require("../database/sql_server_connection");
const nodemailer = require("nodemailer");
require("dotenv").config();
const fs = require("fs");
const util = require("util");
const firebaseConnection = require('../database/firebase_connection');
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');

const db = getFirestore(firebaseConnection);

const emailHost = process.env.EM_HOST; // passar os dados do .env para as constantes
const emailPort = process.env.EM_PORT;
const emailUser = process.env.EM_USER;
const emailPassword = process.env.EM_PASSWORD;

const transport = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: true,
    auth: {
        user: emailUser,
        pass: emailPassword
    }
});

const ArquivoModel = require("../db_table_models/ArquivoModel");

class Arquivo {
    constructor() {
        this.readDir = fs.readdirSync;
        this.reader = util.promisify(fs.readFile);
        this.writer = util.promisify(fs.writeFile);
        this.unlink = util.promisify(fs.unlink);
        this.filePath;
    }

    async CreateFiles() {
        const dataToCreateFiles = await this.GetDataToCreateFile();
        const filesReferences =  await this.GetEachFileReference();

        for(var i = 0; i < filesReferences.length; i++) {
            var fileReference = filesReferences[i].dataValues.REFCLI;

            const doc = await db.collection("delivery_m51_sent_files").where("reference", "==", fileReference).limit(1).get();

            if(doc.empty) {
                var fileName = filesReferences[i].dataValues.ARQTXT;
                var boundFileLines = await this.BindFileLines(fileReference, dataToCreateFiles);
    
                await this.WriteFile("./Arquivos-M51/" + fileName + ".txt", boundFileLines);
                await this.SaveSentFile(fileReference);
            }
        }
    }

    async SendEmail() {
        try {
            const emails = await this.GetEmails();

            for(var i = 0; i < emails.length; i++) {
                await transport.sendMail(emails[i])
                    .then((res) => {
                        console.log(res);
                        var fileToDelete = emails[i].attachments[0].path;
                        this.DeleteFile(fileToDelete);
                    })
                    .catch((err) => console.log(err));
            }

            return true;
        } catch(err) {
            console.log(err);
            return false;
        }
    }

    async WriteFile(filename, data) {
        try {
            await this.writer(filename, data);
            return true;
        } catch (err) {
            return false;
        }
    }

    async ReadFile(filename) {
        try {
            return await this.reader(filename);
        } catch (err) {
            return false;
        }
    }

    async ReadDirectory(directoryPath) {
        try {
            return this.readDir(directoryPath);
        } catch (err) {
            return false;
        }
    }

    async DeleteFile(path) {
        try {
            await this.unlink(path);
            console.log(path + " Deletado!");
            return true;
        } catch (err) {
            return false;
        }
    }

    async GetDataToCreateFile() {
        try {
            const arquivos = await sqlConnection.query(
                "SELECT * FROM VW_ENVIA_M51_EMAIL WHERE QUANTI IS NOT NULL AND DATINC=CAST(GETDATE() AS DATE) ORDER BY REFCLI",
                {
                    type: QueryTypes.SELECT,
                    model: ArquivoModel,
                    mapToModel: true,
                }
            );

            return arquivos;
        } catch(error) {
            console.error("Erro na consulta:", error);
            throw error;
        }
    }

    async GetEachFileReference() {
        try {
            const filesReferences = await sqlConnection.query(
                "SELECT DISTINCT REFCLI, ARQTXT FROM VW_ENVIA_M51_EMAIL WHERE QUANTI IS NOT NULL AND DATINC=CAST(GETDATE() AS DATE) ORDER BY REFCLI",
                {
                    type: QueryTypes.SELECT,
                    model: ArquivoModel,
                    mapToModel: true,
                }
            );

            return filesReferences;
        } catch(error) {
            console.error("Erro na consulta:", error);
            throw error;
        }
    }

    async GetEmailsAddressToSend() {
        const emailsAddress = await db.collection("delivery_m51_email_list").get();
        var emailsAddressList = "";

        emailsAddress.forEach(email => {
            emailsAddressList += email.data().email + ", ";
        })

        return emailsAddressList;
    }

    async SaveSentFile(reference) {
        await db.collection("delivery_m51_sent_files").add({ reference, createdAt: FieldValue.serverTimestamp() })
            .catch((error) => {
                console.error("Erro na consulta:", error);
                throw error;
            });
    }

    async DeleteOldSavedFiles() {
        const dateTime = new Date();
        const day = dateTime.getDate();
        const month = dateTime.getMonth() + 1;
        const year = dateTime.getFullYear();

        const stringDate = year + "-" + month + "-" + day;
        const date = new Date(stringDate);

        const docsQuery = await db.collection("delivery_m51_sent_files").where("createdAt", "<", date).get();
    
        const docsDeletions = docsQuery.docs.map(async (doc) => {
            await doc.ref.delete();
        });

        await Promise.all(docsDeletions);
    }

    async BindFileLines(fileReference, dataToCreateFiles) {
        var boundFileLines = "";
        const formattedTimeStamp = await this.FormatTimeStamp(await this.GetTimeStamp());
        
        for(var i = 0; i < dataToCreateFiles.length; i++) {
            var fileData = dataToCreateFiles[i].dataValues;
            var { reference, refcli, refprf, quanti, coduni, codlot, centroCusto, cliente, numite } = await this.GetFileLineData(fileData);

            if(fileReference == reference) {
                boundFileLines += refcli + refprf + quanti + coduni + codlot + centroCusto + cliente + numite + formattedTimeStamp + "\r\n";
            }
        }

        return boundFileLines;
    }

    async GetTimeStamp() {
        return new Date();
    }

    async FormatTimeStamp(timeStamp) {
        Date.prototype.yyyymmdd = function () {
            var mm = this.getMonth() + 1;
            var dd = this.getDate();

            return [
                this.getFullYear(),
                (mm > 9 ? '' : '0') + mm,
                (dd > 9 ? '' : '0') + dd
            ].join('');
        };

        return timeStamp.yyyymmdd() + "000000";
    }

    async GetFileLineData(fileLineData) {
        const reference = fileLineData.REFCLI;
        const refcli = fileLineData.REFCLI.padEnd(10, " ");
        const refprf = fileLineData.REFPRF.padStart(15, "0");
        const quanti = fileLineData.QUANTI.toString().padStart(8, "0") + "." + "0000";
        const coduni = fileLineData.CODUNI.padStart(2, " ");
        const codlot = fileLineData.CODLOT ? fileLineData.CODLOT.padEnd(20, " ").toUpperCase() : "".padEnd(20, " ").toUpperCase();
        const centroCusto = "".padStart(11, "0");
        const cliente = "".padStart(5, "0");
        const numite = fileLineData.NUMITE.padStart(6, "0");

        return { reference, refcli, refprf, quanti, coduni, codlot, centroCusto, cliente, numite };
    }

    async GetEmails() {
        try {
            var files = await this.ReadDirectory("./Arquivos-M51");
            var emails = [];
    
            for(var i = 0; i < files.length; i++) {
                const reference = await this.GetFileInfoToSendEmail(files[i]);
    
                emails.push(await this.WriteEmail(reference));
            }
    
            return emails;
        } catch(err) {
            return false;
        }
    }

    async WriteEmail(reference) {
        const emailsAddressList = await this.GetEmailsAddressToSend();

        return {
            from: "expedicao@ssonic.com.br",
            to: emailsAddressList,
            subject: "Arquivo M51 - Remessa: " + reference,
            html: `
                <p>Prezados, segue em anexo o arquivo M51 referente a remessa ` + reference + `.</p>
                <p>
                    Este é um e-mail automático, favor não responder.<br>
                    Em caso de dúvida entrar em contato por este <a href="mailto:matheus.silva@ssonic.com.br,felipe.roberto@ssonic.com.br?subject=DÚVIDA%20ARQUIVO%20M51&cc=pablo.touret@ssonic.com.br, gabriel.melo@ssonic.com.br&body=Estou%20com%20uma%20dúvida%20sobre%20o%20M51.">e-mail</a>.
                </p>
            `,
            attachments: [
                {
                    path: this.filePath
                },
            ]
        };
    }

    async GetFileInfoToSendEmail(fileName) {
        try {
            this.filePath = "./Arquivos-M51/" + fileName;
            const fileContent = await this.ReadFile(this.filePath);
            return fileContent.toString("ascii").substring(0, 8);
        } catch(err) {
            return false;
        }
    }
}

module.exports = Arquivo;