require('dotenv').config();
const express = require('express');
const app = express();
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const User = require('./models/User');
const Otp = require('./models/Otp');

app.use(express.json());

// health
app.get('/', (req, res) => res.send('Ecommerce auth backend is running'));

// routes
app.use('/api/auth', authRoutes);

// sync db and start
const PORT = process.env.PORT || 4000;
(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    // For development: sync (in production use migrations)
    await sequelize.sync({ alter: true });
    console.log('DB synced');

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
    //catch error
  } catch (err) {
    console.error('Unable to start server:', err);
    process.exit(1);
  }
})();
