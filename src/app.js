let _ = require('lodash');
let mongoose = require('mongoose');
let Telegraf = require('telegraf');

let helpers = require('./helpers');
let ImageFinder = require('./imageFinder');
let Queue = require('./queue');
let ThreadFinder  = require('./threadsFinder');
let ThreadModel = require('./threadModel');

class BoardsFactory {
    constructor(config) {
        console.log(new Date(), 'started');
        let self = this;
        this.config = config;
        this.scopes = {};

        mongoose.connect(this.config.db, err => {
            if (err) {
                console.log(new Date(), 'Could not connect to mongodb on localhost.');
            }
        });

        _.each(this.config.boards, boardSettings => {
            let id = helpers.hashObject(_.clone(boardSettings));
            this.scopes[id] = _.clone(boardSettings);
            let scope = this.scopes[id];

            scope.threadFinder = new ThreadFinder(config, boardSettings);
            scope.queue = new Queue(config, boardSettings);
            scope.imageFinder = new ImageFinder(config, boardSettings, scope.queue);
            scope.telegraf = new Telegraf(boardSettings.botId);

            scope.telegraf.on('callback_query', tg => {
                let response = tg.update.callback_query.data.split(' ');
                let resolution = response[0]; // approve or decline
                let boardAndThread = response[1].split('/');
                let fromUser = tg.update.callback_query.from.id;
                if (fromUser === this.config.opId) {
                    let approved = resolution === 'approve';
                    ThreadModel.find({board: boardAndThread[0], num: Number(boardAndThread[1])}, (err, thread) => {
                        if (thread.length === 1) {
                            thread[0].set({approved}).save((err, response) => {
                                if (!err) {
                                    let text = `RESOLUTION: ${resolution.toUpperCase()} \n\n${tg.update.callback_query.message.text}`;
                                    tg.editMessageText(text);
                                }
                            });
                        }
                    });
                }
            });

            scope.telegraf.startPolling();
        });
    }

    static saveErrorToDb(error) {
        console.log(error);
    }
}

module.exports = BoardsFactory;