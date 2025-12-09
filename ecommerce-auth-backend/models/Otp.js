const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

class Otp extends Model {}

Otp.init({
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  code: { type: DataTypes.STRING(10), allowNull: false },
  type: { type: DataTypes.ENUM('email','phone','login'), allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  used: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  sequelize,
  modelName: 'Otp',
  tableName: 'otps',
  timestamps: true
});

Otp.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Otp, { foreignKey: 'userId' });

module.exports = Otp;
