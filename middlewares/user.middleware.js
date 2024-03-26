const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const userModel = require("../models/user.model");

const auth = async (req, res, next) => {
  try {
    if (!req.headers.authorization)
      return res.status(401).send({ error: "Unauthorized" });
    const token = req.headers.authorization.split(" ")[1];
    //check expired token
    // const decodedToken = jwt.decode(token);
    if (token) {
      try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const id = decodedData?.id;
        if (!mongoose.Types.ObjectId.isValid(id))
          return res.status(404).json({ error: "No user with that id" });
        const user = await userModel.findById(id);
        if (!user) return res.status(404).json({ error: "Invalid Token" });
        req.userId = id;
        next();
      } catch (err) {
        console.log(err);
        return res
          .status(401)
          .json({ error: "Token expired, please log in again" });
      }
    } else {
      return res.status(401).send({ error: "Found Unauthorized" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = auth;
// export default auth;
