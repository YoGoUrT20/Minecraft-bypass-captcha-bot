const mineflayer = require('mineflayer')
const Jimp = require('jimp');
const cvocrModule = require("captcha-cv-ocr");
const mineflayerViewer = require('prismarine-viewer').mineflayer
const { Vec3 } = require('vec3')
var readline = require('readline');
const { start } = require('repl');
const { exit } = require('process');


var options = {
    host: "", //adress
    port: 25565, //port
    username: "", //nickname
    version: "" //version
};


var bot = mineflayer.createBot(options);
bindEvents(bot);

function bindEvents(bot) {

    bot.on('error', function (err) {
        console.log("Bot has encountered an error");
    });

    bot.on('end', function () {
        console.log("Bot has ended");
        setTimeout(relog, 10000);
    });

    function relog() {
        console.log("Attempting to reconnect...");
        bot = mineflayer.createBot(options);
        bindEvents(bot);
    }
}


async function getCode(map, fg) {
    const size = Math.sqrt(map.data.length)

    // Create a new blank image, same size as Robotjs' one
    let jimg = new Jimp(size, size);
    let orig = new Jimp(size, size);

    // Display the image as a black/white ascii
    for (let i = 0; i < size; i++) {
        let line = ''
        for (let j = 0; j < size; j++) {
            let v = map.data[i * 128 + j]
            line += (v != fg) ? ' ' : '#'
            jimg.setPixelColor((v != fg) ? 0xFF : 0xAAAAAAFF, j, i);
            orig.setPixelColor(((v * 256 + v * 256 * 256 + v * 256 * 256 * 256) | 0xFF) >>> 0, j, i);
        }
    }

    jimg.write("map.png");
    orig.write("clr.png");

    var modes = ["simplest", "grids_and_equations", "dots_and_chars"];
    let results = [];
    for (let mode of modes) {
        let cvocr = new cvocrModule(mode);
        await cvocr.init(1);
        var ans = await cvocr.recognize("map.png");
        ans.result = ans.result.trim();
        //console.log("mode=" + mode);
        results.push(ans.result);
        //if (ans.result)
        //   break;
    }
    console.log(results);
    return ans.results[0];
}

bot.once('spawn', () => {
    mineflayerViewer(bot, { firstPerson: true, port: 3000 })
})

bot._client.on('map', async (map) => {
    //  Make an histogram of the colors
    const h = {}
    for (const v of map.data) {
        if (!h[v]) h[v] = 0
        h[v]++
    }

    // The most popular color is background, the second is the numbers
    const colors = Object.entries(h).sort((a, b) => b[1] - a[1]).map(x => parseInt(x[0], 10))
    let code = '';
    for (let i = 0; i < 4; ++i) {
        code = await getCode(map, colors[i]);
        console.log(i + ": code: '" + code + "'");
        if (code)
            break;
    }

    if (code.length == 3) {
        //bot.chat(code);
        exit();
    } else if (code) {
        console.error("Wrong code: " + code);
        bot.chat("123");
        //bot.quit("123");
    } else {
        console.error("Empty code");
        bot.chat("123");
        //bot.quit("321");
    }
})

// Log errors and kick reasons:
bot.on('kicked', (reason, loggedIn) => {
    console.log('kicked')
    console.log(reason, loggedIn)
})
bot.on('error', err => console.log(err))


// CHAT IN CONSOLE
var r1 = readline.createInterface(
    {
        "input": process.stdin,
        "output": process.stdout
    }
);


function askQuestion(q) {
    return new Promise((resolve, reject) => {
        r1.question(q, (ansv) => {
            return resolve(ansv);
        });
    });
}
