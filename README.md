This module getting images from selected boards and find in boards threads by keywords and send images to your selected telegram recepient.
When thread finded, your bot sends it to you for approve.

usage:

const DvachToTlg = require('2chhk-to-telegram-images-bot');
const dvachToTlg = new DvachToTlg({
    botId: 'botid', // Bot token from BotFather
    boardDomain: 'http://2ch.hk', // board domain
    db: 'mongodb://127.0.0.1:27017/telegram', // mongo db database
    boards: { // object, where key is board and value is boards settings
        b: {
            keywords: ['засмеялся', 'тредшот'], // keywords for send to approve
        }
    },
    opId: 129424520,
    language: 'en',
});

telegramZOBot.getAllThreads().then(_.bind(telegramZOBot.actionsWithFindedThreads, telegramZOBot));