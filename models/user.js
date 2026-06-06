const { Schema, model } = require("mongoose");
const Joi = require("joi");

const { handleMongooseError } = require("../helpers");
const normalizePhone = require("../helpers/normalizePhone");

const emailRegexp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      match: emailRegexp,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      minlength: 6,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    number: {
      type: String,
      set: (value) => normalizePhone(value),
      unique: false,
      required: true,
    },
    link: {
      type: String,
    },
    offlineShop: {
      type: Boolean,
      required: false,
    },
    onlineShop: {
      type: Boolean,
      required: false,
    },
    socialMedia: {
      type: Boolean,
      required: false,
    },
    optUser: {
      type: Boolean,
      required: true,
    },

    isAdmin: {
      type: Boolean,
      required: false,
    },

    token: {
      type: String,
      default: "",
    },
    avatarURL: {
      type: String,
      required: true,
    },
    verify: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      default: "",
    },
  },
  { strictPopulate: false, versionKey: false, timestamps: true }
);

userSchema.post("save", handleMongooseError);

const phoneJoi = Joi.string()
  .required()
  .custom((value, helpers) => {
    try {
      return normalizePhone(value);
    } catch (e) {
      return helpers.error("any.invalid");
    }
  }, "phone normalization");

const registerSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  city: Joi.string(),
  number: phoneJoi,
  link: Joi.string().allow(''),
  socialMedia: Joi.boolean(),
  onlineShop: Joi.boolean(),
  offlineShop: Joi.boolean(),
  optUser: Joi.boolean().required(),
  email: Joi.string().pattern(emailRegexp).required(),
  password: Joi.string().min(6).required(),
});

const emailSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required(),
  password: Joi.string().min(6).required(),
});

const schemas = {
  registerSchema,
  emailSchema,
  loginSchema,
};

const User = model("user", userSchema);

module.exports = {
  User,
  schemas,
};
