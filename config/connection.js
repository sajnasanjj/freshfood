const mongoClient = require('mongodb').MongoClient;
const state={db:null}

module.exports.connect=((done)=>{
const url = 'mongodb+srv://sajnamol:sajnamolatlas@cluster0.xkxsk.mongodb.net/foods?retryWrites=true&w=majority'
const dbname = "foods"

mongoClient.connect(url,(err,data)=>{
    if (err) return done(err)
    state.db=data.db(dbname)
    done()
})
})

module.exports.get=(()=>{
    return state.db
})
