const { Schema, model } = require("mongoose");
const Joi = require("joi");

const { handleMongooseError, joiMessagesUk } = require("../helpers");
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
    dropUser: {
      type: Boolean,
      required: false,
      default: false,
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
  .label("Номер телефону")
  .custom((value, helpers) => {
    try {
      return normalizePhone(value);
    } catch (e) {
      return helpers.error("any.invalid");
    }
  }, "phone normalization");

const registerSchema = Joi.object({
  firstName: Joi.string().required().label("Ім'я"),
  lastName: Joi.string().required().label("Прізвище"),
  city: Joi.string().label("Місто"),
  number: phoneJoi,
  link: Joi.string().allow('').label("Посилання"),
  socialMedia: Joi.boolean().label("Соціальні мережі"),
  onlineShop: Joi.boolean().label("Онлайн-магазин"),
  offlineShop: Joi.boolean().label("Офлайн-магазин"),
  optUser: Joi.boolean().required().label("Оптовий покупець"),
  dropUser: Joi.boolean().label("Дроп покупець"),
  email: Joi.string().pattern(emailRegexp).required().label("Електронна пошта"),
  password: Joi.string().min(6).required().label("Пароль"),
}).prefs({ messages: joiMessagesUk });

const emailSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required().label("Електронна пошта"),
}).prefs({ messages: joiMessagesUk });

const loginSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required().label("Електронна пошта"),
  password: Joi.string().min(6).required().label("Пароль"),
}).prefs({ messages: joiMessagesUk });

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
