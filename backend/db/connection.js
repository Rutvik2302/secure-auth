const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`);
    console.log(`\n MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("Error connecting to database:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
