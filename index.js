const express= require('express')
const axios= require('axios')
const redis= require('redis')
const app = express()

const PORT = 3000

const redisPort = 6379
const client = redis.createClient(redisPort)

// Confirm connected to redis with no errors. not required
client.on("error", (err) => {
    console.log(err)
})


app.get('/jobs', async (req, res) => {
    const searchTerm = req.query.search


    try {
        // run search term in redis node client
        client.get(searchTerm, async (err, comments) => {
            if (err) throw err

            // If the data exist on redis return it. 
            if (comments) {
                res.status(200).send({
                    comments: JSON.parse(comments),
                    message: "cached data"
                })
            } else {
                // if data not not exist in redis, fetch data, then save data to redis. use setex to set exp time in seconds.
                // if no expire tiem wanted use client.set instead.
                const comments = await axios.get(`https://jsonplaceholder.typicode.com/posts/${searchTerm}/comments`)
                client.setex(searchTerm, 600, JSON.stringify(comments.data))
                res.status(200).send({
                    comments: comments.data,
                    message: "cache miss"
                })
            }
        })
    } catch (err) {
        res.status(500).send({ message: err.message})
    }
})



app.listen(process.env.port || PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
