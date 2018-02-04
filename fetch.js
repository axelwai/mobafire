const fs = require('fs');
const util = require('util');
const jsdom = require('jsdom');
const virtualConsole = new jsdom.VirtualConsole();
const Crawler = require("crawler");
// const { champs } = require('./resource/base.json');
const mobafire = 'https://www.mobafire.com'
let { champs } = require('./resource/base.json');
const Items = new ItemsContructor();
const Threads = new ThreadsContructor();

// let temp = champs;
// champs=[];
// for(var i = 140; i < 160; i++){
//     champs.push(temp[i])
// }

const settings = {
    limit: {
        champions: 1,
        articles: 3
    }
}


const c = new Crawler({
    jQuery: jsdom,
    maxConnections: 20,
    // This will be called for each crawled page
    callback: function (error, res, done) {
        if (error) { logError(error); }
        else {
            const { document } = new res.options.jQuery.JSDOM(res.body).window;
            notice(['default callback executed', document.title]);
        }
        done();
    }
});


crawlMobafire();

function crawlMobafire() {
    for (let i = 0, champ; champ = champs[i]; i++) {
        if(settings && settings.limit && settings.limit.champions === i) {
            break;
        }
        Threads.add();
        c.queue([{
            uri: champs[i].link,
            callback: handleChampion(champ)
        }]);
    }
    Threads.callback = onThreadsFinish;

    function onThreadsFinish() {
        const data = { champs, items: Items.getAll() };

        let dataString = JSON.stringify(data);
        fs.writeFile('resource/test.json', dataString, 'utf8', (error) => {
            if(error) {
                logError(['writeFile', error]);
            }
            else {
                notice(['resource/test.json ready']);
            }
        });
        dataString = `window.champions = ${JSON.stringify(champs)};window.items = ${JSON.stringify(Items.getAll())};`;
        fs.writeFile('public/data/index.js', dataString, 'utf8', (error) => {
            if(error) {
                logError(['writeFile', error]);
            }
            else {
                notice(['public/data/index.js ready']);
            }
        });
    }
};

function handleChampion(champ) {
    return handle;

    function handle(error, res, done) {

        if (error) { logError(error); }
        else {
            const { window } = new res.options.jQuery.JSDOM(res.body);
            const { document } = window;
            const articles = document.querySelectorAll('.browse-list__item');

            // notice(['handleChampion', document.title]);

            champ.articles = [];
            for (let i = 0, article; (i < settings.limit.articles && (article = articles[i])); i++) {
                champ.articles[i] = {
                    'title': article.querySelector('.browse-list__item__desc__title').textContent,
                    'link': mobafire + article.href
                };

                Threads.add();
                c.queue([{
                    uri: champ.articles[i].link,
                    callback: handleArticle(champ.articles[i])
                }]);

                if (i === settings.limit.articles - 1) {
                    // notice(['handleChampion', 'done']);
                    Threads.done();
                }
            }

        }
        done();
    }
}

function handleArticle(article) {
    return handle;

    function handle(error, res, done) {

        if (error) { logError(error); }
        else {
            const { window } = new res.options.jQuery.JSDOM(res.body);
            const { document } = window;
            const builds = document.querySelectorAll('.build-box');

            // notice(['handleArticle', document.title]);

            article.builds = [];
            for (let i = 0, build; build = builds[i]; i++) {
                article.builds[i] = {
                    'title': build.querySelector('.build-title h2').textContent.trim(),
                    'background': build.querySelector('.build-wrap').style.backgroundImage.replace('url(','url(' + mobafire),
                    'itemsGroups': getItemsGroups(build)
                };

                if (i === builds.length - 1) {
                    Threads.done();
                    // notice(['handleArticle', 'done'])
                }
            }

        }
        done();
    }
}

function getItemsGroups(buildContainer) {
    const itemsContainers = buildContainer.querySelectorAll('.item-wrap');

    let itemsGroups = [];
    // console.log('getItemsGroups itemsContainers', itemsContainers.length);
    for (var i = 0, itemsContainer; itemsContainer = itemsContainers[i]; i++) {

        itemsGroups.push({
            'title': itemsContainer.querySelector('h2').textContent.trim(),
            'items': getItems(itemsContainer)
        });
    }

    return itemsGroups;
}

function getItems(itemsContainer) {
    const itemContainers = itemsContainer.querySelectorAll('.main-items a');

    let items = [];
    let itemId = null;
    for (var i = 0, itemContainer; itemContainer = itemContainers[i]; i++) {
        itemId = Items.add(itemContainer).id;
        items.push(itemId);
    }

    return items;
}

function ItemsContructor() {
    const Super = this;
    let items = {};

    this.add = add;
    this.get = get;
    this.getAll = getAll;

    function add(itemAnchor) {
        let id = getId(itemAnchor);
        let item, title, link, thumbnail;

        if (!items[id]) {
            title = itemAnchor.querySelector('.item-title span').textContent;
            link = mobafire + itemAnchor.href;
            thumbnail = mobafire + itemAnchor.querySelector('.item img').src;
            item = { id, title, link, thumbnail };
            items[id] = item;
        }
        else {
            item = Super.get(id);
        }

        return item;
    }

    function get(id) {
        return items[id];
    }

    function getId(itemAnchor) {
        return itemAnchor.querySelector('div:first-child').className.match(/i:'(\d*)'/)[1];
    }

    function getAll() {
        return items;
    }
}

function ThreadsContructor() {
    const Super = this;

    this.requests = 0;
    this.finishedRequests = 0;
    this.callback = undefined;

    this.add = addReq;
    this.done = done;

    function addReq() {
        Super.requests++;
    }

    function done() {
        Super.finishedRequests++;
        if (typeof Super.callback === 'function' && Super.requests === Super.finishedRequests) {
            Super.callback();
        }
    }

    function asd(n) {
        notice({
            'treads': Super.requests,
            'done': Super.finishedRequests
        });
    }

}

function logError(error) {
    console.log('\x1b[31m\x1b[0m', 'default error:', error);
}

function notice(msgs) {
    console.log('\x1b[36m%s\x1b[0m', JSON.stringify(msgs, null, 2));
}

/*
Colors reference

Reset = "\x1b[0m"
Bright = "\x1b[1m"
Dim = "\x1b[2m"
Underscore = "\x1b[4m"
Blink = "\x1b[5m"
Reverse = "\x1b[7m"
Hidden = "\x1b[8m"

FgBlack = "\x1b[30m"
FgRed = "\x1b[31m"
FgGreen = "\x1b[32m"
FgYellow = "\x1b[33m"
FgBlue = "\x1b[34m"
FgMagenta = "\x1b[35m"
FgCyan = "\x1b[36m"
FgWhite = "\x1b[37m"

BgBlack = "\x1b[40m"
BgRed = "\x1b[41m"
BgGreen = "\x1b[42m"
BgYellow = "\x1b[43m"
BgBlue = "\x1b[44m"
BgMagenta = "\x1b[45m"
BgCyan = "\x1b[46m"
BgWhite = "\x1b[47m"
*/