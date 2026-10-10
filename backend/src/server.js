const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');

connectDB();

app.listen(env.PORT, () => {
  console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});
