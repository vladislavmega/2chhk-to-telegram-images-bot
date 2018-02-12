let ThreadModel = require('./threadModel');
const {Telegram, Extra} = require('telegraf');
let helpers = require('./helpers');
let _ = require('lodash');
let request = require("request");

class ThreadFinder {
    constructor(globalConfig, config) {
        this.config = config;
        this.globalConfig = globalConfig;
        this._id = helpers.hashObject(config);

        setInterval(() => {
            this.getAllThreads();
        }, globalConfig.findNewThreadsInterval);
        this.telegram = new Telegram(this.config.botId, {});
    }

    getAllThreads() {
        let self = this;
        request({
            url: `${this.globalConfig.boardDomain}/${this.config.board}/threads.json`,
            json: true
        }, function (error, response, body) {
            if (error) {
                console.log(new Date(), error);
            } else {
                let threadsWithLowerCaseSubject = _.map(body.threads, thread => {
                    return Object.assign(thread, {
                        subject: thread.subject.toLowerCase(),
                        configId: self._id,
                        board: self.config.board,
                    });
                });

                self.actionsWithFindedThreads(threadsWithLowerCaseSubject)
            }
        });
    }

    actionsWithFindedThreads(threads) {
        let threadsWithKeywords = _.filter(threads, thread => {
            let findedWord = [];
            thread.board = this.config.board;
            _.each(this.config.keywords, keyword => {
                if (thread.subject.indexOf(keyword) !== -1) findedWord.push(thread);
            });
            return findedWord.length;
        });

        this.saveNewThreads(threadsWithKeywords);
    }

    saveNewThreads(threads) {
        let threadLength = threads.length;
        let savedThreads = 0;
        let doNextStep = () => {
            if (threadLength === savedThreads) this.notifyNewThreads();
        };
        threads.forEach(thread => {
            ThreadModel.findOrCreate({num: thread.num}, Object.assign({
                notified: false,
                approved: false,
                isAlive: true,
                lastSended: 0,
            }, thread), (err, result) => {
                savedThreads++;
                doNextStep();
            });
        })
    }

    notifyNewThreads() {
        ThreadModel.find({notified: false}, (err, threads) => {
            threads.forEach(thread => {
                let message = `${thread.subject} ${this.globalConfig.boardDomain}/${thread.get('board')}/res/${thread.get('num')}.html`;
                let systemMessage = `${thread.get('board')}/${thread.num}`;
                const markup = Extra
                    .HTML()
                    .markup((m) => m.inlineKeyboard([
                        m.callbackButton('Approve', 'approve ' + systemMessage),
                        m.callbackButton('Decline', 'decline ' + systemMessage),
                    ], {columns: 2}));

                this.telegram.sendMessage(this.globalConfig.opId, message, {
                    reply_markup: markup.reply_markup
                }).then(err => {
                    thread.set({notified: true}).save();
                });
            });
        });
    }
}

module.exports = ThreadFinder;