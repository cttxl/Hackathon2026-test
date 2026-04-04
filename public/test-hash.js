const bcrypt = require('bcryptjs');

const hash = '$2a$10$kItRUdzWLlfcVX2EeZf4ruPKoknMGx2s2k9lGdHrkcgb5F29jblc2';

const testPasswords = ['admin', 'password', '123456', 'admin123'];

testPasswords.forEach(pw => {
  const isMatch = bcrypt.compareSync(pw, hash);
  if (isMatch) {
    console.log('Match found:', pw);
  }
});
