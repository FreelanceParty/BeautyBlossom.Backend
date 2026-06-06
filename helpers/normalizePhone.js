const {parsePhoneNumberFromString} = require("libphonenumber-js");

const normalizePhone = (input, {defaultCountry = "UA"} = {}) => {
	if (input === undefined || input === null) {
		return "";
	}

	const raw = String(input).trim();
	if (!raw) {
		return "";
	}

	const normalizeCandidate = (candidate) => {
		const phoneNumber = parsePhoneNumberFromString(candidate, defaultCountry);
		if (phoneNumber && phoneNumber.isValid()) {
			return phoneNumber.number; // E.164, e.g. +380501234567
		}
		return null;
	};

	// 1) Try as-is (works for +380..., 0XXXXXXXXX with defaultCountry)
	let normalized = normalizeCandidate(raw);
	if (normalized) return normalized;

	// 2) If it's digits-only without '+', try treating it as already-international and add '+'
	//    Example: 37377964046 -> +37377964046
	const digitsOnly = raw.replace(/\s+/g, "").replace(/[()\-]/g, "");
	if (/^00\d+$/.test(digitsOnly)) {
		normalized = normalizeCandidate("+" + digitsOnly.slice(2));
		if (normalized) return normalized;
	}
	if (/^\d+$/.test(digitsOnly)) {
		normalized = normalizeCandidate("+" + digitsOnly);
		if (normalized) return normalized;
	}

	const err = new Error("Invalid phone number");
	err.code = "INVALID_PHONE";
	throw err;
};

module.exports = normalizePhone;
