export default () => ({
    port: process.env.PORT || 4000,
    database: {
        url: process.env.DATABASE_URL,
    },
});