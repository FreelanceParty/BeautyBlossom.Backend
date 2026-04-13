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
        const { code, meta } = options;
        if (code) error.code = code;
        if (meta) error.meta = meta;
    }

    return error;
}




module.exports = HttpError;