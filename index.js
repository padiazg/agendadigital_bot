
const debug = require("debug")("tw-bot");
const Twitter = require("twitter");
const TelegramBot = require('node-telegram-bot-api');
const async = require("async");

// leemos nuestra configuración
const config = require("./config.js");

// creamos la interfaz con Telegram
const bot = new TelegramBot(config.telegram.token, {polling: true});

// creamos una cola para publicar asíncronamente
const botQueue = async.queue((task, done) => {
    console.log(`sending to Telegram => ${task.id}`);
    bot.sendMessage(config.telegram.chatId, task.message);
    done();
}, config.queueSize);

// creamos la interfaz con Tweeter
const client = new Twitter(config.twitter);

client.stream('statuses/filter', {track: 'AgendaDigital'}, stream => {

    // respondemos a cuando hay tweets que cumplent con nuestro criterio de
    // filtrado
    stream.on('data', tweet => {
        //console.log(`tweet =>`,tweet);
        const tweetUrl = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`;
        const message = `${tweet.text} (${tweetUrl})`;

        debug(`\n> quoted => ${!!tweet.quoted_status} | retweeted => ${!!tweet.retweeted_status}`);
        debug(`message => ${message}`);

        // aquí decidimos si enviamos o no el tweet a Telegram
        // tweet nuevo
        if (config.ignoreQuoted && !!tweet.quoted_status) {
          debug('Ignoring quoted');
          return;
        };
        if (config.ignoreRetweeted && !!tweet.retweeted_status) {
          debug('Ignoring retweeted');
          return;
        };

        // if (!tweet.quoted_status && !tweet.retweeted_status) {
        //   publicar = true;
        // }
        // else { // RT
        //   if (!!tweet.quoted_status) { // RT con comentario
        //     publicar = config.publishQuoted;
        //   }
        //   else { // RT sin comentario
        //     publicar = config.publishRetweeted;
        //   }
        // }

        // enviamos a la cola para publicación
         botQueue.push({message, id: tweet.id});
    });

    stream.on('error', error => {
      console.log(error);
      process.exit(-1);
    });
});
