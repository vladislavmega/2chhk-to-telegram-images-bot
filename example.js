const TelegramZOBot = require('./src/app');
const telegramZOBot = new TelegramZOBot({
    boardDomain: 'http://2ch.hk',
    db: 'mongodb://127.0.0.1:27017/telegram',
    opId: 123456, // id of threads approver
    findNewThreadsInterval: 300000,
    boards: [
        {
            botId: 'BOTID_HERE',
            board: 'b',
            keywords: ['засмеялся', 'тредшот', 'засмеял', 'обосрался', 'проиграл'],
            type: 'photo',
            withPostMessage: false,
            recepient: '-12345678', // channel id
            updateTime: 30000,
        },
    ],
});