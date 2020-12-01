const redis = require('redis')
const dotenv = require('dotenv');

dotenv.config();

const client = redis.createClient(
    process.env.REDIS_PORT,
    process.env.REDIS_ADDRESS
);

client.on('error', (err) => {
    console.log("redis Error: " + err);
});

exports.isCache = async (req, res, next) => {
    const key = "" + req.params.lat + req.params.lon;

    await client.lrange(key, 0, -1, async (err, arr) => {
        if (err) throw err;
        if(arr.length !== 0) {
            // console.log(arr[0])
            // const data = JSON.parse(arr);
            const weather = await parseData(arr);
            console.log("call cache ok");
            res.send(weather);

        } else {
            next();
        }
    })
}

exports.setCache = (key, body, start = 0) => {
    try {
        for (let i = start; i < body.length; i += 3) {
            const data = {
                dt: body[i].dt,
                temp: body[i].temp,
                feels_like: body[i].feels_like,
                clouds: body[i].clouds,
                rain: body[i].rain,
                snow: body[i].snow,
                weather: body[i].weather
            }

            client.rpush(key, JSON.stringify(data));
        }
        
        console.log("set Cache OK");
        client.expire(key, 60);
        
    } catch (error) {
        console.error("setCache Error: " + error);
    }
}

async function parseData(data) {
    const weathers = {
        "yesterdays": [],
        "todays": [],
        "tomorrows": [],
    }

    weathers.yesterdays = data.slice(5, 13).map((v) => {
        return JSON.parse(v);
    });
    weathers.todays = data.slice(13, 21).map((v) => {
        return JSON.parse(v);
    });
    weathers.tomorrows = data.slice(21, 30).map((v) => {
        return JSON.parse(v);
    });

    return weathers
}