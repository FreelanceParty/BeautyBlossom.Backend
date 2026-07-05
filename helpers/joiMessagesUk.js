// Українські повідомлення для Joi-валідації.
// Використовуються через schema.prefs({ messages }) і наслідуються дочірніми полями.
const joiMessagesUk = {
	"any.required":         "Поле {#label} є обов'язковим",
	"any.invalid":          "Поле {#label} має некоректне значення",
	"any.only":             "Поле {#label} має некоректне значення",
	"string.base":          "Поле {#label} має бути рядком",
	"string.empty":         "Поле {#label} не може бути порожнім",
	"string.min":           "Поле {#label} має містити щонайменше {#limit} символів",
	"string.max":           "Поле {#label} має містити не більше {#limit} символів",
	"string.email":         "Поле {#label} має бути коректною електронною поштою",
	"string.pattern.base":  "Поле {#label} має некоректний формат",
	"number.base":          "Поле {#label} має бути числом",
	"boolean.base":         "Поле {#label} має бути логічним значенням (true/false)",
	"object.unknown":       "Поле {#label} не дозволене",
};

module.exports = joiMessagesUk;
