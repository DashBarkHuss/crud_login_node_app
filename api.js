class database {
    static test(params) {
        return"dbtest";
    }
}
class API {
    static test(params) {
        return "apitest";
    }
}

module.exports = {API, database};