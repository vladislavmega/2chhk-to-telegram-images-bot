let _ = require('lodash');
let request = require("request");

let helpers = require('./helpers');
let ImagesModel = require('./imagesModel');
let ThreadModel = require('./threadModel');

class ImageFinder {
    constructor (globalConfig, config, queue) {
        this.config = config;
        this.globalConfig = globalConfig;
        this.queue = queue;
        this._id = helpers.hashObject(config);

        setInterval(()=>{
            this.sendImagesFromApprovedThreads();
        }, this.config.updateTime);
    }

    sendImagesFromApprovedThreads() {
        let self = this;
        ThreadModel.find({approved: true, isAlive: true, configId: this._id}, (err, threads) => {
            threads.forEach(thread => {
                let url = `${this.globalConfig.boardDomain}/makaba/mobile.fcgi?task=get_thread&board=${thread.board}&thread=${thread.num}&post=0`;
                request({
                    url: url,
                    json: true
                }, function (error, response, body) {
                    // thread in bump limit
                    if (body && body.length && Array.isArray(body)) {
                        self.findNewImagesInThread(thread, body);
                    } else if (body && body.Code === -404) {
                        self.queue.removeDeadThreadImages({
                            num: thread.num,
                            board: thread.board,
                        });
                        thread.set({isAlive: false}).save();
                    }
                });
            });
        });
    }

    findNewImagesInThread(oldState, thread) {
        let lastSendInThread = thread[thread.length - 1].timestamp;
        let oldSendInThread = oldState.get('lastSended');
        let imagesArray = _.flatten(
            _.map(
                _.filter(
                    thread, o => o.timestamp > oldSendInThread
                        && o.files.length > 0
                ),
                item => item.files
            )
        );

        let md5HashesArray = _.map(imagesArray, image => image.md5);
        ImagesModel.find({md5: {$in: md5HashesArray}}, (err, response) => {
            let notUniqArray = _.map(response, model => model.toJSON().md5);
            imagesArray = _.filter(imagesArray, image => {
                return _.indexOf(notUniqArray, image.md5) === -1;
            });
            _.each(imagesArray, image => {
                this.queue.pushToQueue(image);
            });
            oldState.set('lastSended', lastSendInThread).save();
        });
    }
}

module.exports = ImageFinder;