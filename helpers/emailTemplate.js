const fs = require("fs/promises");
const path = require("path");

const escapeHtml = (v) => String(v ?? "").replace(/[&<>\"']/g, (ch) => {
	if (ch === "&") return "&amp;";
	if (ch === "<") return "&lt;";
	if (ch === ">") return "&gt;";
	if (ch === "\"") return "&quot;";
	return "&#39;";
});

const wrapWithBrandedLayout = ({
	title,
	subtitle,
	topHtml,
	contentHtml,
	cta,
	footerText,
} = {}) => {
	const safeTitle = escapeHtml(title);
	const safeSubtitle = subtitle ? escapeHtml(subtitle) : "";
	const footer = escapeHtml(footerText || "Beauty Blossom • Відправлено з сайту");
	const topBlockHtml = topHtml
		? `
		<tr>
			<td style="padding:0 18px 12px 18px;">
				<div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #f0e6ef;font-family:Arial,sans-serif;">
					<div style="padding:22px 22px 18px 22px;">
						${topHtml}
					</div>
				</div>
			</td>
		</tr>
		`
		: "";
	const ctaHtml = cta?.url && cta?.label
		? `
		<div style="height:18px;line-height:18px;">&nbsp;</div>
		<div style="text-align:center;">
			<a href="${cta.url}" style="display:inline-block;background:#fed7f3;color:#111827;text-decoration:none;padding:12px 18px;border-radius:999px;font-family:Arial,sans-serif;font-weight:700;font-size:14px;border:1px solid #f3bde2;">${escapeHtml(cta.label)}</a>
		</div>
		`
		: "";

	return `
<div style="margin:0;padding:0;background:#f7f7fb;">
	<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f7f7fb;padding:24px 12px;">
		<tr>
			<td align="center">
				<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;">
					<tr>
						<td style="padding:14px 18px;text-align:center;">
							<img src="cid:bb-logo" alt="Beauty Blossom" width="160" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;" />
						</td>
					</tr>
					${topBlockHtml}
					<tr>
						<td style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #f0e6ef;">
							<div style="padding:22px 22px 10px 22px;font-family:Arial,sans-serif;">
								<div style="font-size:20px;line-height:26px;font-weight:700;color:#111827;">${safeTitle}</div>
								${subtitle ? `<div style="margin-top:6px;font-size:13px;line-height:18px;color:#6b7280;">${safeSubtitle}</div>` : ""}
							</div>
							<div style="padding:0 22px 18px 22px;font-family:Arial,sans-serif;">
								${contentHtml || ""}
								${ctaHtml}
							</div>
						</td>
					</tr>
					<tr>
						<td style="padding:14px 18px;text-align:center;font-family:Arial,sans-serif;color:#9ca3af;font-size:12px;">
							${footer}
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</div>
`;
};

const getBrandedLogoAttachment = async () => {
	const logoPath = path.join(__dirname, "..", "public", "logo.png");
	const content = await fs.readFile(logoPath);
	return {filename: "logo.png", content, cid: "bb-logo"};
};

module.exports = {
	escapeHtml,
	wrapWithBrandedLayout,
	getBrandedLogoAttachment,
};
