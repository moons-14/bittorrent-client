export const hashEncode = (buffer: Buffer) => {
    let h = buffer.toString("hex");
    h = h.replace(/.{2}/g, function (m) {
        var v = parseInt(m, 16);
        if (v <= 127) {
            m = encodeURIComponent(String.fromCharCode(v));
            if (m[0] === '%')
                m = m.toLowerCase();
        } else
            m = '%' + m;
        return m;
    });
    return h;
}