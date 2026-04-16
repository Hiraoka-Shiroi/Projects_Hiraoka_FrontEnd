let message
let accessLevel
export { message, accessLevel }

if (accessLevel === 'admin') {
  message = 'Welcome, admin!'
} else if (accessLevel === 'user') {
  message = 'Welcome, user!'
} else {
  message = 'Access denied.'
}