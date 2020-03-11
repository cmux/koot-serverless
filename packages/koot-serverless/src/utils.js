const getVersion = (prefix = "release-") => {
    const now = new Date();
    const fixZero = el => (el < 10 ? "0" + el : el);
    const YYYY = now.getFullYear();
    const MM = fixZero(now.getMonth() + 1);
    const DD = fixZero(now.getDate());
    const hh = fixZero(now.getHours());
    const mm = fixZero(now.getMinutes());
    const dateString = `${YYYY}${MM}${DD}-${hh}${mm}`;
    return `${prefix}${dateString}`;
};

module.exports = {
    getVersion
};
