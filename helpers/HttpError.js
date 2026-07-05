const errorMessageList = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not found",
    409: "Conflict"
}

const HttpError = (status, message = errorMessageList[status], options = {}) => {
    const error = new Error(message);
    error.status = status;

    if (options && typeof options === "object") {
        const { code, meta, isValidation, errors, isCustom } = options;
        if (code) error.code = code;
        if (meta) error.meta = meta;
        if (isValidation) error.isValidation = true;
        if (errors) error.errors = errors;
        if (isCustom) error.isCustom = true;
    }

    return error;
}




module.exports = HttpError;