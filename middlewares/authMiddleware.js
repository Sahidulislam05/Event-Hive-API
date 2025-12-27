const admin = require("firebase-admin");
const User = require("../models/User");

// JWT
const verifyJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ message: "Unauthorized Access!" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.tokenEmail = decodedToken.email;
    next();
  } catch (error) {
    return res.status(403).send({ message: "Forbidden Access!" });
  }
};

const verifyAdmin = async (req, res, next) => {
  const email = req.tokenEmail;
  const user = await User.findOne({ email });
  if (!user || user.role !== "admin") {
    return res.status(403).send({
      message: "Admin only Actions!",
      role: user?.role,
    });
  }

  next();
};

const verifyManager = async (req, res, next) => {
  const email = req.tokenEmail;
  const user = await User.findOne({ email });
  if (user?.role !== "manager" && user?.role !== "admin") {
    return res.status(403).send({ message: "Manager only access!" });
  }
  next();
};

module.exports = { verifyJWT, verifyAdmin, verifyManager };
