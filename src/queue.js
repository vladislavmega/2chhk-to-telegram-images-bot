let _ = require('lodash');
let cmd = require('node-cmd');
let fs = require('fs');
let md5 = require('md5');

let helpers = require('./helpers');
let ImagesModel = require('./imagesModel');

class Queue {
    constructor(globalConfig, config) {
        this.config = config;
        this.globalConfig = globalConfig;
        this.queue = [];
        setInterval(() => {
            this.post();
        }, this.config.updateTime);
    }

    removeDeadThreadImages(thread) {
        this.queue = _.filter(this.queue, image => {
            let path = image.path.split('/');
            let board = path[1];
            let num = path[3];
            return !(thread.num === num && thread.board === board);
        })
    }

    pushToQueue(image) {
        console.log(new Date(), 'push ot queue: ', image.path);
        let alreadyInQueue = _.find(this.queue, {md5: image.md5});
        if (!alreadyInQueue) {
            let fileFormat = image.path.split('.')[1];
            let allowedFormats;
            if (this.config.type === 'photo') {
                allowedFormats = ['jpg', 'png', 'jpeg'];
            }

            if (this.config.type === 'video') {
                allowedFormats = ['webm', 'mp4'];
            }

            if (allowedFormats.indexOf(fileFormat) !== -1) {
                this.queue.push(image);
            }
        }
    }

    post() {
        console.log(new Date(), 'queue length:', this.queue.length);
        if (!this.queue.length) return;
        let self = this;
        let image = this.queue[0];
        let url = self.globalConfig.boardDomain + image.path;
        let fileFormat = image.path.split('.')[1];
        let localFile = process.cwd() + '/tmp/' + md5(url) + '.' + fileFormat;

        console.log(new Date(), url, fileFormat, localFile);
        helpers.download(url, localFile, (err, filename) => {
            if (!err) {
                ImagesModel.create(image, (err, result) => {});
                let method = '';
                if (self.config.type === 'video') method = 'sendVideo';
                if (self.config.type === 'photo') method = 'sendPhoto';

                let curlcommand = 'curl -s -X POST "https://api.telegram.org/bot'+self.config.botId+'/'+ method +'" -F chat_id=' + self.config.recepient + ' -F '+self.config.type+'="@' + localFile + '"';
                cmd.get(curlcommand,
                    function (err, data, stderr) {
                        fs.unlink(localFile, ()=>{});
                        self.queue.shift();
                        console.log(new Date(), err, data);
                    }
                );
            } else {
                self.queue.shift();
            }
        });
    }
}

module.exports = Queue;