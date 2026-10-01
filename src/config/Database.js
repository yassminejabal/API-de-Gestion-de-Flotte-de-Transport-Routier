const mongoose = require('mongoose');

class Database{
    constructor(){
        this.connect()
    }
    async connect(){
        const uri = process.env.MONGO_URI || "mongodb://localhost:27017/fleet_db"
        try {
            await mongoose.connect(uri);
            console.log("mongoose connect mongodb");
            
            
        } catch (error) {
            console.log("error dans connection de db");
            
            console.log(error);
            process.exit(1)
        }
    }
}

// singleton la creation d'une seuls databese
 //contre dans module.exports = Database(); chaque instance la creation d'une autre conection
module.exports = new Database();