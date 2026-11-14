const READ_METHODS = ["GET", "HEAD", "OPTIONS"];
const RETRY_AFTER_SECONDS = 1800;

const maintenance = (req, res, next) => {
	if (process.env.MAINTENANCE_MODE !== "true" || READ_METHODS.includes(req.method)) {
		return next();
	}
	res.set("Retry-After", String(RETRY_AFTER_SECONDS));
	res.status(503).json({
		message:     "Проводимо технічні роботи, спробуйте трохи пізніше",
		maintenance: true,
	});
};

module.exports = maintenance;
