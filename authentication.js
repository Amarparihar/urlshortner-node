const jwt = require("jsonwebtoken");

const { MongoClient, ObjectID } = require("mongodb");
const URL = process.env.dbURL || "mongodb://localhost:27017";
const DB = "urlshortnerdatabase";

function authorized(req, res, next) {
  if (req.headers.authorization) {
    try {
      let decoded = jwt.verify(req.headers.authorization, process.env.JWT_KEY);
      console.log(decoded);
      if (decoded) {
        req.user_id = decoded._id;

        next();
      }
    } catch (error) {
      console.log(error);
      res.status(401).json({
        message: "Invalid Token",
      });
    }
  } else {
    res.status(401).json({ message: "No token passed" });
  }
}

module.exports = authorized;
