import bcrypt from 'bcrypt'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question('Enter admin password to hash: ', async (password) => {
  try {
    const saltRounds = 10
    const hash = await bcrypt.hash(password, saltRounds)
    console.log('\nCopy this hash to your .env file as ADMIN_PASSWORD_HASH:')
    console.log(hash)
    rl.close()
  } catch (error) {
    console.error('Error generating hash:', error)
    rl.close()
    process.exit(1)
  }
})
