var express = require('express');

module.exports = function (MySQL) {
    var router = express.Router();

    this.transaction;

    router.post('/open', async (req, res) => {
        try{
            if(!this.transaction)
                this.transaction = await MySQL.transaction();

            res.status(200).send("OK! Transaction started");
        } catch (e) {
            res.status(500).send(e);
        }
    });

    router.post('/new', async (req, res) => {
        try{
            var json = req.body;
            let val = json.val;
            let text = json.text;

            let result = await this.transaction.queryAsync(
                'INSERT INTO stuff (`text`, `number`) VALUES (?,?)',
                [text, val]);

            res.status(200).send("OK! uid " + result.insertId);
        } catch (e) {
            res.status(500).send(e);
        }
    });

    router.post('/add', async (req, res) => {
        try{
            var json = req.body;
            let uid = json.uid;
            let val = json.val;

            let rows = await this.transaction.queryAsync('SELECT * FROM stuff WHERE uid = ?', [uid]);
            let newVal = rows[0].number += val;
            let result = await this.transaction.queryAsync(
                'UPDATE stuff SET `number` = ? WHERE uid = ?',
                [newVal, uid]);

            res.status(200).send("OK! Updated " + result.changedRows + " rows");
        } catch (e) {
            res.status(500).send(e);
        }
    });

    router.post('/set', async (req, res) => {
        try{
            var json = req.body;
            let uid = json.uid;
            let text = json.text;

            let result = await this.transaction.queryAsync(
                'UPDATE stuff SET `text` = ? WHERE uid = ?',
                [text, uid]);

            res.status(200).send("OK! Updated " + result.changedRows + " rows");
        } catch (e) {
            res.status(500).send(e);
        }
    });

    router.post('/commit', async (req, res) => {
        try{
            await this.transaction.commitAsync();
            delete this.transaction;
            res.status(200).send("OK! Commited");
        } catch (e) {
            res.status(500).send(e);
        }
    });

    router.post('/rollback', async (req, res) => {
        try{
            await this.transaction.rollbackAsync();
            delete this.transaction;
            res.status(200).send("OK! Rollback");
        } catch (e) {
            res.status(500).send(e);
        }
    });

    return router;
};