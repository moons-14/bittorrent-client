export const hashEncode = (buffer: Buffer) => {
	let h = buffer.toString("hex");
	h = h.replace(/.{2}/g, (_m) => {
		let m = _m;
		const v = Number.parseInt(m, 16);
		if (v <= 127) {
			let m = encodeURIComponent(String.fromCharCode(v));
			if (m[0] === "%") m = m.toLowerCase();
		} else m = `%${m}`;
		return m;
	});
	return h;
};
